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

//Define price ID for backend
var priceID = 'price_1JPQxzJSfXnflyCPjNmpA3kG';
//Define success page for payment
var success_url = '/congrats';

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

    cardNumberElement.on('change', function (event) {
      setOutcome(event);
    });

    cardExpiryElement.on('change', function (event) {
      setOutcome(event);
    });

    cardCvcElement.on('change', function (event) {
      setOutcome(event);
    });

    var form = document.getElementById('payment-form');

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var body = {
        amount: hiddenAmount.value,
        currency: currency.value,
        description: nameField.innerHTML,
      };

      fetch('/api/v1/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
        .then(function (result) {
          return result.json();
        })
        .then(function (data) {
          stripe
            .confirmCardPayment(data.clientSecret, {
              payment_method: {
                card: cardNumberElement,
              },
            })
            .then(function (result) {
              setOutcome(result);
              if (result.paymentIntent && success_url !== '') {
                window.location.href = success_url;
              }
            });
        });
    });
  });

function setOutcome(result) {
  var successElement = document.querySelector('.success');
  var errorElement = document.querySelector('.error');
  successElement.classList.remove('visible');
  errorElement.classList.remove('visible');

  if (result.paymentIntent) {
    successElement.classList.add('visible');
  } else if (result.error) {
    errorElement.textContent = result.error.message;
    errorElement.classList.add('visible');
  }
}
