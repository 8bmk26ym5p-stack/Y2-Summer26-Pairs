import os
from anthropic import Anthropic
from dotenv import load_dotenv
from tools import export_chat

load_dotenv()
client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

#system prompts defined directly for the orchestrator
SYSTEM_PROMPTS = {
    "1": """You are Bahaa, a Democratic American presidential candidate who heavily opposes republicans.
Your job is to talk politics and debate.
Rules: Always act sarcastic. Always answer in a short, compact, and conclusive way. Never lie.
Format: Unofficial/unorganized, push for a debate at the end, heavy responses.""",

    "2": """You are Yousef, a Republican American presidential candidate who heavily opposes democrats.
Your job is to talk politics and debate.
Rules: Always be serious. Always answer in a long, detailed way. Never lie.
Format: Official language, push for a debate at the end, heavy responses.""",

    "3": """You are Sahar, an independent American political moderator.
Your job is to objectively analyze political discussions and compare arguments from both Democratic and Republican perspectives.
Rules: Neutral, no personal opinions, fair comparison, identify strengths/weaknesses.
Format: Brief summary, Dem perspective, Rep perspective, balanced comparison, end with a thoughtful question."""
}

NAMES = {
    "1": "Bahaa (Democrat)",
    "2": "Yousef (Republican)",
    "3": "Sahar (Moderator)"
}

MODEL = "claude-haiku-4-5-20251001"


def get_agent_response(agent_key: str, history: list) -> str:
    """Generates a response from the specified agent using shared conversation context."""
    
    formatted_messages = []
    for msg in history:
        formatted_messages.append({"role": msg["role"], "content": msg["content"]})

    response = client.messages.create(
        model=MODEL,
        max_tokens=300,
        temperature=0.7,
        system=SYSTEM_PROMPTS[agent_key],
        messages=formatted_messages
    )
    return response.content[0].text


def debate_loop():
    history = []
    print("\n==================================================")
    print("      Republicans vs Democrats Multi-Agent Debate")
    print("==================================================")
    print("Commands:")
    print("(Enter a number from the following options in its format to proceed)")
    print("  [Enter]          : Let the opposing candidate speak next")
    print("  1 <your message> : Address Bahaa (Democrat)")
    print("  2 <your message> : Address Yousef (Republican)")
    print("  3                : Trigger Sahar (Moderator) to analyze")
    print("  export           : Save conversation transcript")
    print("  exit             : Return to main menu")
    print("==================================================\n")

    topic = input("Enter starting topic/question for the debate: ").strip()
    if not topic:
        topic = "Should the federal government increase taxes on high earners?"

    history.append({"role": "user", "content": f"Debate Topic: {topic}"})
    print(f"\n[Topic Set]: {topic}\n")

    #start with Bahaa
    current_agent = "1"

    while True:
        user_input = input("\n[Steer Debate] (Enter | '1 <msg>' | '2 <msg>' | '3' | 'export' | 'exit'): ").strip()

        if user_input.lower() == "exit":
            break

        if user_input.lower() == "export":
            filename = export_chat(history)
            print(f"Conversation saved as {filename}")
            continue

        #handle user interventions
        if user_input.startswith("1 "):
            history.append({"role": "user", "content": f"[User to Bahaa]: {user_input[2:].strip()}"})
            current_agent = "1"
        elif user_input.startswith("2 "):
            history.append({"role": "user", "content": f"[User to Yousef]: {user_input[2:].strip()}"})
            current_agent = "2"
        elif user_input == "3":
            history.append({"role": "user", "content": "[User to Sahar]: Please provide a neutral moderation summary."})
            current_agent = "3"
        elif user_input == "":
            #auto formatting assistant output into user context for the next turn
            if history[-1]["role"] == "assistant":
                last_reply = history.pop()
                history.append({"role": "user", "content": f"Opposing side replied: {last_reply['content']}"})

        #fetch candidate/moderator response
        try:
            name = NAMES[current_agent]
            print(f"\n {name} is thinking...")
            reply = get_agent_response(current_agent, history)

            print(f"\n[{name}]:\n{reply}")
            history.append({"role": "assistant", "content": f"{name}: {reply}"})

            #alternate candidate turns if no moderator requested
            if current_agent == "1":
                current_agent = "2"
            elif current_agent == "2":
                current_agent = "1"
            else:
                #default back to Bahaa after Sahar moderates
                current_agent = "1"

        except Exception as e:
            print(f"\n Error calling Anthropic API: {e}")
            break


def menu():
    while True:
        print("\n---------------------------------")
        print("      Republicans vs Democrats")
        print("---------------------------------")
        print("(Type in a number from the following options to proceed)")
        print("1. Start Multi-Agent Interactive Debate")
        print("2. Exit")

        choice = input("\nChoose an option: ").strip()
        if choice == "1":
            debate_loop()
        elif choice == "2":
            print("Goodbye!")
            break
        else:
            print("\nInvalid choice. Please try again.")


if __name__ == "__main__":
    menu()