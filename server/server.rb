require 'stripe'
require 'sinatra'
require 'sinatra/namespace'
require 'dotenv'
require './config_helper.rb'

# Copy the .env.example in the root into a .env file in this folder

Dotenv.load
ConfigHelper.check_env!

Stripe.api_version = '2020-08-27'
Stripe.api_key = ENV['STRIPE_SECRET_KEY']

set :static, true
set :public_folder, File.join(File.dirname(__FILE__), ENV['STATIC_DIR'])
set :port, 4242

before do
  headers['Access-Control-Allow-Origin'] = '*'
end

options '*' do
  response.headers['Allow'] = 'HEAD, GET, PUT, DELETE, OPTIONS, POST'
  response.headers['Access-Control-Allow-Headers'] = 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Cache-Control, Accept'
end

get '/' do
  content_type 'text/html'
  send_file File.join(settings.public_folder, 'index.html')
end

get '/congrats' do
  send_file File.join(settings.public_folder, 'success.html')
end

namespace '/api/v1' do
  post '/initialize-data' do
    content_type 'application/json'

    data = JSON.parse(request.body.read)

    price = Stripe::Price.retrieve(data['priceID'])
    corrected_price = price['unit_amount'].to_f / 100

    product = Stripe::Product.retrieve(price['product'])

    {
      productName: product['name'],
      price: price['unit_amount'],
      correctedPrice: corrected_price,
      currency: price['currency']
    }.to_json
  end
  
  post '/create-payment-intent' do
    content_type 'application/json'
    
    data = JSON.parse(request.body.read)
    
    payment_intent = Stripe::PaymentIntent.create(
      amount: data['amount'].to_i,  
      currency: data['currency'],
      description: data['description'],
      receipt_email: 'denis2085@mail.ru'
    )

    {
      clientSecret: payment_intent['client_secret'],
    }.to_json
  end
end