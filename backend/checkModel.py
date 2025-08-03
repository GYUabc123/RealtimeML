import pickle

# Load the model
with open('model/model.pkl', 'rb') as f:
    model = pickle.load(f)

# Check the type of model
print(type(model))

# Print model details
print(model)

print(model.get_params())  # For sklearn models

print("--------------------------------")
print(model.classes_)
