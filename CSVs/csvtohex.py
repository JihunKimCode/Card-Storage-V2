def csv_to_hex_string(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    return content.encode("utf-8").hex()

def hex_string_to_csv(hex_string, output_path):
    text = bytes.fromhex(hex_string).decode("utf-8")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(text)

hex_str = csv_to_hex_string("pokemon_cards_final.csv")
print(hex_str)

# hex_string_to_csv(hex_str, "reconstructed.csv")
