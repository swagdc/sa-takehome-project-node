const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
require('dotenv').config();
//const stripe = require('stripe');
const stripe = require("stripe")("sk_test_51L0vuSBaqV8NGaouuaWkXBLUpVhVJmyTbaNuEcFyONCfF1iJTu8jR6KzdZm3ToMmqmAmjyQu06khybhKmKz4sAIk00e44VP5VB");

var app = express();

// view engine setup (Handlebars)
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }))
app.use(express.json({}));

/**
 * Home route
 */
app.get('/', function(req, res) {
  res.render('index');
});

/**
 * Checkout route
 */
app.get('/checkout', function(req, res) {
  // Just hardcoding amounts here to avoid using a database
  const item = req.query.item;
  let title, amount, error;

  switch (item) {
    case '1':
      title = "The Art of Doing Science and Engineering"
      amount = 2300      
      break;
    case '2':
      title = "The Making of Prince of Persia: Journals 1985-1993"
      amount = 2500
      break;     
    case '3':
      title = "Working in Public: The Making and Maintenance of Open Source"
      amount = 2800  
      break;
    default:
      // Included in layout view, feel free to assign error
      error = "No item selected"      
      break;
  }

  res.render('checkout', {
    title: title,
    amount: amount,
    error: error
  });
});


/**
 * return client secret
 */
app.post('/create-payment-intent', async (req, res) => {
    const { items } = req.body;
    //console.log(items[0].amount);
    //hardcoded purchase element has first element as amount
  
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(items[0].amount),
      currency: 'usd',
      payment_method_types: ["card"],
    });

    res.send({clientSecret: paymentIntent.client_secret});
});

/**
 * return publishable key
 */
 app.get('/publishable-key',  (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

// /**
//  * Payment-intent route
//  */
//  app.post("/create-payment-intent", async (req, res) => {
//   const { items } = req.body;
//   // Create a PaymentIntent with the order amount and currency
//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: 200,
//     currency: "usd"
//   });

//   res.send({
//     clientSecret: paymentIntent.client_secret
//   });
// });

/**
 * Success route
 */
app.get('/success', function(req, res) {
  res.render('success');
});

/**
 * Handle return_url
 */
 app.get('/status', function(req, res) {
  res.render('status');
});


/**
 * Webhook to handle response
 */

 app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  let event = request.body;
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = request.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});


/**
 * Start server
 */
app.listen(3000, () => {
  console.log('Getting served on port 3000');
});


