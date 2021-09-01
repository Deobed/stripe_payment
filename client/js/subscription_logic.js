var stripe = Stripe(
  'pk_test_51JLbBuJSfXnflyCPIoo8Z5EXO8aKsZKrvKQijIIiZjQ271ghjfOQH0TV0cRh2apWZabyGrARKXsBgige0iaMLGOH00KrbCuzTe',
  {
    locale: 'en',
  }
);

var button = document.getElementsByTagName('button')[0];
var nameField = document.getElementById('product-name');
var hiddenAmount = document.getElementById('payment-amount');
var amount = document.getElementById('amount');
var currencyField = document.getElementById('currency');
var emailInput = document.getElementById('receipt-email-field');
var cardholder = document.getElementById('cardholder-name-field');

//Define price ID for backend
var priceID = 'price_1JRe5cJSfXnflyCPYueI7o9K';
//Define success page for payment
var successUrl = '/congrats';
//Define trial days
// var trialDays = 7;

var init_body = {
  priceID: priceID,
};

fetch('/api/v1/initialize-data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(init_body),
})
  .then(function (result) {
    return result.json();
  })
  .then(function (data) {
    button.disabled = false;
    nameField.innerHTML = data.productName;
    hiddenAmount.value = data.price;
    currency.value = data.currency;
    amount.innerHTML = data.correctedPrice;

    var elements = stripe.elements();
    var style = {
      base: {
        iconColor: '#666EE8',
        color: '#31325F',
        lineHeight: '40px',
        fontWeight: 300,
        fontFamily: 'Helvetica Neue',
        fontSize: '15px',

        '::placeholder': {
          color: '#CFD7E0',
        },
      },
    };

    var cardNumberElement = elements.create('cardNumber', {
      style: style,
    });
    cardNumberElement.mount('#card-number-element');

    var cardExpiryElement = elements.create('cardExpiry', {
      style: style,
    });
    cardExpiryElement.mount('#card-expiry-element');

    var cardCvcElement = elements.create('cardCvc', {
      style: style,
    });
    cardCvcElement.mount('#card-cvc-element');

    cardNumberElement
      .on('change', function (event) {
        errorClass('remove');
        setOutcome(event);
      })
      .on('blur', function (event) {
        removeEmptyClassError();
      });

    cardExpiryElement
      .on('change', function (event) {
        errorClass('remove');
        setOutcome(event);
      })
      .on('blur', function (event) {
        removeEmptyClassError();
      });

    cardCvcElement
      .on('change', function (event) {
        errorClass('remove');
        setOutcome(event);
      })
      .on('blur', function (event) {
        removeEmptyClassError();
      });

    var additional_fields = document.querySelectorAll('.additional-field');

    additional_fields.forEach(function (field) {
      field.addEventListener('change', function (event) {
        errorClass('remove');
        removeEmptyClassError();
      });
      field.addEventListener('blur', function (event) {
        removeEmptyClassError();

        checkAdditionalFieldValue();
      });
    });

    var form = document.getElementById('payment-form');

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var body = {
        amount: hiddenAmount.value,
        currency: currency.value,
        description: nameField.innerHTML,
      };

      createSubscriptionPayment(cardNumberElement);
    });
  });

var emptyAdditionalFields = function () {
  var additional_fields = document.querySelectorAll('.additional-field');
  var value = false;

  additional_fields.forEach(function (field) {
    value = field.value == '';
  });

  return value;
};

function createSubscriptionPayment(cardNumberElement) {
  stripe.createToken(cardNumberElement).then(function (result) {
    checkAdditionalFieldValue();

    if (result.error || emptyAdditionalFields()) {
      errorClass('add');
      if (emptyAdditionalFields()) {
        error = getErrors();
      } else {
        error = result;
      }
      setOutcome(error, emptyAdditionalFields());
    } else {
      fetch('/api/v1/create-customer', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailInput.value,
          cardholder: cardholder.value,
          product: nameField.innerHTML,
        }),
      })
        .then(function (result) {
          return result.json();
        })
        .then(function (data) {
          return fetch('/api/v1/create-subscription', {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              priceID: priceID,
              customerID: data.customer.id,
              trialDays: typeof trialDays !== 'undefined' ? trialDays : null,
            }),
          });
        })
        .then(function (result) {
          return result.json();
        })
        .then(function (data) {
          if (typeof trialDays !== 'undefined') {
            if (data.invoice && successUrl !== '') {
              window.location.href = successUrl;
            }
          } else {
            confirmPayment(data.clientSecret, cardNumberElement);
          }
        });
    }
  });
}

function confirmPayment(clientSecret, cardElement) {
  stripe
    .confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: cardholder.value,
        },
      },
      receipt_email: emailInput.value,
    })
    .then(function (result) {
      if (result.paymentIntent && successUrl !== '') {
        window.location.href = successUrl;
      } else {
        setOutcome(result);
      }
    });
}

function setOutcome(result, only_text = false) {
  var successElement = document.querySelector('.success');
  var errorElement = document.querySelector('.error');
  successElement.classList.remove('visible');
  errorElement.classList.remove('visible');

  if (only_text) {
    errorElement.textContent = result;
    errorElement.classList.add('visible');
  } else {
    if (result.paymentIntent) {
      successElement.classList.add('visible');
    } else if (result.error) {
      errorElement.textContent = result.error.message;
      errorElement.classList.add('visible');
    }
  }
}

function errorClass(operation) {
  var fields = document.querySelectorAll(
    '.StripeElement--invalid, .StripeElement--empty'
  );
  fields.forEach(function (field) {
    if (operation === 'add') {
      field.classList.add('field-with-error');
    } else {
      field.classList.remove('field-with-error');
    }
  });
}

function removeEmptyClassError() {
  errorClass('add');
  var fields = document.querySelectorAll('.StripeElement--empty');

  fields.forEach(function (field) {
    field.classList.remove('field-with-error');
  });

  var errorElement = document.querySelector('.error');
  errorElement.classList.remove('visible');
}

function getErrors() {
  if (document.getElementById('receipt-email-field').value == '') {
    return 'Your email field is incomplete';
  }

  if (document.getElementById('cardholder-name-field').value == '') {
    return 'Your name field is incomplete';
  }
}

function checkAdditionalFieldValue() {
  var additional_fields = document.querySelectorAll('.additional-field');

  additional_fields.forEach(function (field) {
    if (field.value == '') {
      field.parentNode.classList.add('StripeElement--empty');
    } else {
      field.parentNode.classList.remove('StripeElement--empty');
    }
  });
}
