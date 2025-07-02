from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import select

DATABASE_URL = "sqlite:///./dsa_gpt.db"
engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    from models import UserQuestionProgress
    SQLModel.metadata.create_all(engine)

# Dependency for getting DB session

def get_session():
    with Session(engine) as session:
        yield session 

def seed_questions():
    from models import Question
    base_questions = [
        # Basic
        {"title": "Reverse an Array", "difficulty": "basic", "description": "Given an array, reverse the elements in place. Example: [1,2,3] -> [3,2,1]", "solution": "Reverse the array using two pointers or built-in reverse method."},
        {"title": "Find Maximum Element", "difficulty": "basic", "description": "Given an array, find the maximum element. Example: [1,5,2] -> 5", "solution": "Use max() function or iterate and keep track of the largest value."},
        {"title": "Check Palindrome String", "difficulty": "basic", "description": "Given a string, check if it is a palindrome. Example: 'madam' -> True, 'hello' -> False", "solution": "Compare the string with its reverse."},
        {"title": "Factorial of a Number", "difficulty": "basic", "description": "Given a number N, return its factorial. Example: 5 -> 120", "solution": "Multiply all numbers from 1 to N."},
        {"title": "Fibonacci Sequence up to N", "difficulty": "basic", "description": "Print the Fibonacci sequence up to N terms. Example: N=5 -> 0,1,1,2,3", "solution": "Start with 0,1 and add previous two numbers."},
        {"title": "Sum of Digits", "difficulty": "basic", "description": "Given a number, find the sum of its digits. Example: 123 -> 6", "solution": "Convert number to string and sum the digits."},
        {"title": "Count Vowels in String", "difficulty": "basic", "description": "Given a string, count the number of vowels. Example: 'hello' -> 2", "solution": "Iterate and count 'a','e','i','o','u'."},
        {"title": "Second Largest in Array", "difficulty": "basic", "description": "Find the second largest element in an array. Example: [1,3,2] -> 2", "solution": "Sort and pick second last, or track two largest values."},
        {"title": "Check Prime Number", "difficulty": "basic", "description": "Check if a number is prime. Example: 7 -> True, 8 -> False", "solution": "Check divisibility from 2 to sqrt(n)."},
        {"title": "Remove Duplicates from Array", "difficulty": "basic", "description": "Remove duplicate elements from an array. Example: [1,2,2,3] -> [1,2,3]", "solution": "Use set() or track seen elements."},
        # Intermediate
        {"title": "Merge Two Sorted Arrays", "difficulty": "intermediate", "description": "Given two sorted arrays, merge them into a single sorted array.", "solution": "Use two pointers to merge into a new array."},
        {"title": "Intersection of Two Arrays", "difficulty": "intermediate", "description": "Find the intersection of two arrays. Example: [1,2,3], [2,3,4] -> [2,3]", "solution": "Use set intersection or nested loops."},
        {"title": "Binary Search", "difficulty": "intermediate", "description": "Implement binary search for a sorted array. Return the index of the target element.", "solution": "Check middle, then left or right half recursively or iteratively."},
        {"title": "First Non-Repeating Character", "difficulty": "intermediate", "description": "Find the first non-repeating character in a string. Example: 'aabbcde' -> 'c'", "solution": "Use a hash map to count occurrences."},
        {"title": "Rotate Array by K", "difficulty": "intermediate", "description": "Rotate an array to the right by K steps. Example: [1,2,3,4,5], K=2 -> [4,5,1,2,3]", "solution": "Reverse parts of the array or use slicing."},
        {"title": "Longest Common Prefix", "difficulty": "intermediate", "description": "Find the longest common prefix among an array of strings. Example: ['flower','flow','flight'] -> 'fl'", "solution": "Compare characters of all strings at each position."},
        {"title": "Stack Using Arrays", "difficulty": "intermediate", "description": "Implement a stack using arrays with push, pop, and top operations.", "solution": "Use a list with append and pop methods."},
        {"title": "Find Missing Number", "difficulty": "intermediate", "description": "Given an array of size N-1 containing numbers from 1 to N, find the missing number.", "solution": "Sum 1 to N and subtract array sum."},
        {"title": "Balanced Parentheses", "difficulty": "intermediate", "description": "Check if an expression has balanced parentheses. Example: '(()())' -> True, '(()' -> False", "solution": "Use a stack to track open and close parentheses."},
        {"title": "Pairs with Given Sum", "difficulty": "intermediate", "description": "Find all pairs in an array that sum up to a given value. Example: [1,2,3,4], sum=5 -> [(1,4),(2,3)]", "solution": "Use a hash set to check for complement."},
        # Advanced
        {"title": "Longest Increasing Subsequence", "difficulty": "advanced", "description": "Find the length of the longest increasing subsequence in an array.", "solution": "Use dynamic programming to track LIS ending at each index."},
        {"title": "LRU Cache", "difficulty": "advanced", "description": "Design and implement a Least Recently Used (LRU) cache.", "solution": "Use OrderedDict or a doubly linked list with a hash map."},
        {"title": "Dijkstra's Shortest Path", "difficulty": "advanced", "description": "Find the shortest path in a graph using Dijkstra's algorithm.", "solution": "Use a priority queue to pick the next closest node."},
        {"title": "Cycle in Linked List", "difficulty": "advanced", "description": "Detect if a linked list has a cycle. Return True if a cycle exists.", "solution": "Use slow and fast pointers (Floyd's algorithm)."},
        {"title": "Kth Largest Element", "difficulty": "advanced", "description": "Find the kth largest element in an array.", "solution": "Use a min-heap of size k or sort and pick."},
        {"title": "Trie (Prefix Tree)", "difficulty": "advanced", "description": "Implement a Trie with insert, search, and startsWith methods.", "solution": "Use a tree of nodes for each character."},
        {"title": "Strongly Connected Components", "difficulty": "advanced", "description": "Find all strongly connected components in a directed graph.", "solution": "Use Kosaraju's or Tarjan's algorithm."},
        {"title": "Word Break Problem", "difficulty": "advanced", "description": "Given a string and a dictionary, determine if the string can be segmented into a space-separated sequence of dictionary words.", "solution": "Use dynamic programming to check all prefixes."},
        {"title": "Serialize and Deserialize Binary Tree", "difficulty": "advanced", "description": "Design algorithms to serialize and deserialize a binary tree.", "solution": "Use preorder traversal with null markers."},
        {"title": "Median of Two Sorted Arrays", "difficulty": "advanced", "description": "Find the median of two sorted arrays.", "solution": "Use binary search to partition arrays."},
    ]
    languages = ["Python", "C++", "JavaScript"]
    questions = []
    for base in base_questions:
        for lang in languages:
            questions.append(Question(**base, language=lang))
    with Session(engine) as session:
        if not session.exec(select(Question)).first():
            session.add_all(questions)
            session.commit() 