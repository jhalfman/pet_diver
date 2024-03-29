Rails.application.routes.draw do
  
  resources :enemies, only: [:create, :update, :destroy]
  resources :dives, only: [:create, :update, :index]
  resources :pets, only: [:create, :destroy, :update]
  resources :enemy_archetypes, only: [:index]
  resources :pet_archetypes, only: [:index]
  resources :characters, only: [:create, :destroy, :update]
  resources :users, only: [:create, :destroy, :show]

  get "/characters/character/:name", to: "characters#show"
  get "/dives/:character_id", to: "dives#show"
  post "/login", to: "sessions#create"
  delete "/logout", to: "sessions#destroy"
  # Routing logic: fallback requests for React Router.
  # Leave this here to help deploy your app later!
  get '*path', to: 'fallback#index', constraints: ->(req) { !req.xhr? && req.format.html? }
end
