from datetime import datetime

def export_chat(messages):
    filename = datetime.now().strftime("conversation_%Y%m%d_%H%M%S.txt")

    with open(filename, "w", encoding="utf-8") as file:
        file.write("=== AI Political Debate ===\n\n")

        for message in messages:
            file.write(f"{message['role'].capitalize()}:\n")
            file.write(f"{message['content']}\n")
            file.write("-" * 50 + "\n")

    return filename