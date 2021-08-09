var stripe = Stripe(
  'pk_test_51JLbBuJSfXnflyCPIoo8Z5EXO8aKsZKrvKQijIIiZjQ271ghjfOQH0TV0cRh2apWZabyGrARKXsBgige0iaMLGOH00KrbCuzTe',
  {
    locale: 'en',
  }
);

var purchase = {
  items: [
    {
      id: 'sample-item-12345',
      amount: document.getElementById('payment-amount').value,
    },
  ],
};

document.querySelector('button').disabled = true;

fetch('/api/v1/create-payment-intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(purchase),
})
  .then(function (result) {
    return result.json();
  })
  .then(function (data) {
    var elements = stripe.elements();
    var style = {
      base: {
        color: 'black',
        fontFamily: 'Source Code Pro, Consolas, Menlo, monospace',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#697386',
        },
      },
      invalid: {
        fontFamily: 'Source Code Pro, Consolas, Menlo, monospace',
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    };

    var card = elements.create('card', { style: style });
    // Stripe injects an iframe into the DOM
    card.mount('#card-element');
    var inputs = document.getElementsByClassName('input');
    [...inputs].forEach((element) => {
      element.style.opacity = '1';
      // element.oninput = function (event) {
      //   if (element.getAttribute('id') === 'example2-name') {
      //     document.getElementById('cardholder-in-form').innerHTML =
      //       element.value == ''
      //         ? 'CARDHOLDER NAME'
      //         : element.value.toUpperCase();
      //   } else {
      //   }
      // };
    });
    var button = document.getElementById('button-text');
    button.innerHTML =
      'Pay $' + document.getElementById('payment-amount').value;
    card.on('change', function (event) {
      // Disable the Pay button if there are no card details in the Element
      document.querySelector('button').disabled = event.empty;
      document.querySelector('#card-error').textContent = event.error
        ? event.error.message
        : '';
    });

    var form = document.getElementById('payment-form');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      // Complete payment when the submit button is clicked
      payWithCard(stripe, card, data.clientSecret);
    });
  });

var payWithCard = function (stripe, card, clientSecret) {
  loading(true);
  stripe
    .confirmCardPayment(clientSecret, {
      payment_method: {
        card: card,
      },
    })
    .then(function (result) {
      if (result.error) {
        // Show error to your customer
        showError(result.error.message);
      } else {
        // The payment succeeded!
        orderComplete(result.paymentIntent.id);
      }
    });
};

var orderComplete = function (paymentIntentId) {
  loading(false);
  document.querySelector('.result-message').classList.remove('hidden');
  document.querySelector('button').disabled = true;
  document.querySelector('button').style.backgroundColor = 'grey';
};

var showError = function (errorMsgText) {
  loading(false);
  var errorMsg = document.querySelector('#card-error');
  errorMsg.textContent = errorMsgText;
  setTimeout(function () {
    errorMsg.textContent = '';
  }, 4000);
};

var loading = function (isLoading) {
  if (isLoading) {
    // Disable the button and show a circle
    document.querySelector('button').disabled = true;
    document.querySelector('#circle').classList.remove('hidden');
    document.querySelector('#button-text').classList.add('hidden');
  } else {
    document.querySelector('button').disabled = false;
    document.querySelector('#circle').classList.add('hidden');
    document.querySelector('#button-text').classList.remove('hidden');
  }
};
