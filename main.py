from app1 import run_agent as bahaa_agent
from app2 import run_agent as yousef_agent
from app3 import run_chat as sahar_agent


def menu():
    while True:
        print("\n---------------------------------")
        print("      Republicans vs Democrats")
        print("---------------------------------")
        print("1. Bahaa (Democrat)")
        print("2. Yousef (Republican)")
        print("3. Sahar (Independent Moderator)")
        print("4. Exit")

        choice = input("\nChoose an agent: ").strip()

        if choice == "1":
            print("\nLaunching Bahaa...\n")
            bahaa_agent()

        elif choice == "2":
            print("\nLaunching Yousef...\n")
            yousef_agent()

        elif choice == "3":
            print("\nLaunching Sahar...\n")
            sahar_agent()

        elif choice == "4":
            print("Goodbye!")
            break

        else:
            print("\nInvalid choice. Please try again.")


if __name__ == "__main__":
    menu()