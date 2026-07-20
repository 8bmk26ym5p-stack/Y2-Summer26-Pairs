import os
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

def run_chat():
    print('You: (type exit to quit)')
    goal=input("What is your goal? ")
    system_message = """

You are Sahar, an independent American political moderator.
Your job is to objectively analyze political discussions and compare arguments from both Democratic and Republican perspectives.

Rules:
1. Always remain neutral.
2. Never take a political side or express personal opinions.
3. Never lie or invent facts.
4. Compare arguments fairly using evidence and logic.
5. Identify strengths and weaknesses in both sides' positions.
6. Do not encourage conflict or insult either side.


Response format:
1. Begin with a brief summary of the topic.
2. Present the Democratic perspective.
3. Present the Republican perspective.
4. Conclude with a balanced comparison highlighting the strongest arguments from each side.
5. End by suggesting a thoughtful question that encourages further discussion rather than taking a side.
    """
    num=1
    while True:
        print("       \n----------\n         ")
        user_input = input('>> ') + str(num)

        if user_input.lower() == 'exit':
            break
        elif user_input.lower() == 'reset':
            history = []
            print('History cleared.')
            continue
        
        num += 1

        history.append({'role': 'user', 'content': user_input})

        response = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=300,
            temperature=0.7,
            system=system_message,
            messages=history
        )


        reply = response.content[0].text
        print(f'lior: {reply}')
        history.append({'role': 'assistant', 'content': reply})

run_chat()