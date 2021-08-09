require 'stripe'
require 'sinatra'
require 'sinatra/namespace'
require 'dotenv'
require './config_helper.rb'

# Copy the .env.example in the root into a .env file in this folder

Dotenv.load
ConfigHelper.check_env!
# For sample support and debugging, not required for production:
Stripe.set_app_info(
  'stripe-samples/saving-card-without-payment',
  version: '0.0.1',
  url: 'https://github.com/stripe-samples/saving-card-without-payment'
)
Stripe.api_version = '2020-08-27'
Stripe.api_key = ENV['STRIPE_SECRET_KEY']

set :static, true
set :public_folder, File.join(File.dirname(__FILE__), ENV['STATIC_DIR'])
set :port, 4242

get '/' do
  content_type 'text/html'
  send_file File.join(settings.public_folder, 'index.html')
end

namespace '/api/v1' do
  post '/create-payment-intent' do
    content_type 'application/json'

    data = JSON.parse(request.body.read)
    
    payment_intent = Stripe::PaymentIntent.create(  
      amount: (data['items'].reduce(0.0) { |sum, item| sum += item['amount'].to_f } * 100).round,  
      currency: 'usd'
    )  
    {  
      clientSecret: payment_intent['client_secret'],  
    }.to_json
  end  
end