import base64

# Encode CSV file to Base64 string
def csv_to_base64_string(file_path):
    with open(file_path, 'rb') as f:
        csv_bytes = f.read()
    base64_bytes = base64.b64encode(csv_bytes)
    base64_string = base64_bytes.decode('utf-8')
    return base64_string

# Decode Base64 string back to CSV content
def base64_to_csv(base64_string, output_path=None):
    base64_bytes = base64_string.encode('utf-8')
    csv_bytes = base64.b64decode(base64_bytes)
    
    if output_path:
        with open(output_path, 'wb') as f:
            f.write(csv_bytes)
        print(f"Decoded CSV saved to: {output_path}")
    else:
        return csv_bytes  # Or csv_bytes.decode('utf-8') if you want string

# Example usage:
if __name__ == "__main__":
    encoded_string = csv_to_base64_string('CSVs/pokemon_cards_v2.csv')
    print(encoded_string)

    # Decode and save to file
    # base64_to_csv(encoded_string, 'decoded_base64.csv')
