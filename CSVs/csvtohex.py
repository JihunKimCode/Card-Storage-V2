# Encode CSV file to hex string
def csv_to_hex_string(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    return content.encode("utf-8").hex()

# Decode hex string back to CSV content
def hex_string_to_csv(hex_string, output_path):
    text = bytes.fromhex(hex_string).decode("utf-8")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(text)

if __name__ == "__main__":
    hex_str = csv_to_hex_string("CSVs/pokemon_cards_v2.csv")
    print(hex_str)

    # Decode and save to file
    # hex_string_to_csv(hex_str, "decoded_hex.csv")