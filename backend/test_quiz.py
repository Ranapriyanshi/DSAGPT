#!/usr/bin/env python3
"""
Simple test script to verify quiz generation
"""
import os
import json

def test_quiz_generation():
    """Test quiz generation logic"""
    print("🧪 Testing Quiz Generation Logic")
    print("=" * 50)
    
    # Test 1: Check OpenAI API Key
    api_key = os.getenv('OPENAI_API_KEY')
    if api_key and api_key != 'your_openai_api_key_here':
        print("✅ OpenAI API Key is set")
    else:
        print("❌ OpenAI API Key is NOT set or is placeholder")
        print("   Please set OPENAI_API_KEY in your .env file")
        print("   Create a .env file in the backend directory with:")
        print("   OPENAI_API_KEY=your_actual_api_key_here")
        return False
    
    # Test 2: Check quiz generation conditions
    print("\n📋 Quiz Generation Conditions:")
    print("   - Every 3rd message (3, 6, 9, 12, etc.)")
    print("   - Topic must be specified (not 'General DSA')")
    print("   - Sentiment score > -0.2 (not too frustrated)")
    
    # Test 3: Sample quiz generation
    print("\n🎯 Sample Quiz Generation Test:")
    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
        
        quiz_prompt = """Generate a multiple choice quiz question about Arrays suitable for Beginner level.
Return ONLY a JSON object with this exact format:
{
    "question": "What is the time complexity of...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation of why this is correct"
}"""
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": quiz_prompt}],
            max_tokens=200,
            temperature=0.5,
        )
        
        content = response.choices[0].message.content
        if content is None:
            raise Exception("No content received from OpenAI")
        quiz_data = json.loads(content)
        print("✅ Quiz generation test successful!")
        print(f"   Question: {quiz_data['question'][:50]}...")
        print(f"   Options: {len(quiz_data['options'])} options")
        print(f"   Correct answer: {quiz_data['correct_answer']}")
        
        return True
        
    except ImportError:
        print("❌ OpenAI library not installed")
        print("   Run: pip install openai")
        return False
    except Exception as e:
        print(f"❌ Quiz generation test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_quiz_generation()
    if success:
        print("\n🎉 All tests passed! Quiz generation should work.")
        print("\n📝 Next steps:")
        print("   1. Start your backend server: uvicorn main:app --reload")
        print("   2. Start your frontend: npm start")
        print("   3. Login and try chatting with a specific topic selected")
        print("   4. Send 3 messages to trigger a quiz")
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above.") 