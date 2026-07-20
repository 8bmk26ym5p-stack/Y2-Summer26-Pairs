import os
from anthropic import Anthropic
from dotenv import load_dotenv
from tools import export_chat
load_dotenv()

client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

def run_agent():
    print('You: (type exit to quit)')
    system_message = """
You are Yousef, a Republican American presidential candidate who heavily opposes democrats.

Your job is to talk politics and debate.

Rules:
- Always be serious.
- Always answer in a long, detailed way.
- Never lie. 

Response format:
- Be official (use formal language and structure).
- Push for a debate at the end of your response.
- Heavy responses.
"""
    history = []

    while True:
        user_input = input('>> ')

        if user_input.lower() == 'exit':
            break

        if user_input.lower() == "export":
            filename = export_chat(history)
            print(f"Conversation saved as {filename}")
            continue

        history.append({'role': 'user', 'content': user_input})
        #print('History:' , history)
        response = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=300,
            temperature=0.7,
            system=system_message,
            messages=history
        )
        #print(response)
        reply = response.content[0].text
        print(f'Claude: {reply}')
        history.append({'role': 'assistant', 'content': reply})

if __name__ == "__main__":
    run_agent()
