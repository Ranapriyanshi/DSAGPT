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
        {"title": "Reverse an Array", "difficulty": "basic",
         "description": "Given an array of integers, your task is to reverse the order of its elements in place. This means you should not use extra space for another array. The first element should become the last, the second should become the second last, and so on. This is a fundamental operation in array manipulation and helps build understanding of pointers and indexing. Try to solve it efficiently, ideally in linear time.",
         "solution": "Reverse the array using two pointers or built-in reverse method.",
         "examples": '[{"input": "5, [1, 2, 3, 4, 5]", "output": "[5, 4, 3, 2, 1]", "explanation": "The array is reversed in place."}, {"input": "3, [10, 20, 30]", "output": "[30, 20, 10]", "explanation": "The three elements are reversed."}]'
        },
        {"title": "Find Maximum Element", "difficulty": "basic",
         "description": "Given an array of numbers, find and return the maximum element present in the array. This is a common operation in data analysis and helps in understanding traversal and comparison logic. The array may contain positive or negative numbers. Your solution should efficiently find the largest value.",
         "solution": "Use max() function or iterate and keep track of the largest value.",
         "examples": '[{"input": "4, [1, 5, 2, 4]", "output": "5", "explanation": "5 is the largest element."}, {"input": "3, [-1, -2, -3]", "output": "-1", "explanation": "-1 is the maximum among negative numbers."}]'
        },
        {"title": "Check Palindrome String", "difficulty": "basic",
         "description": "Given a string, check if it reads the same forwards and backwards (a palindrome). Palindromes are important in string manipulation and have applications in algorithms and data validation. Ignore case and spaces for this problem.",
         "solution": "Compare the string with its reverse.",
         "examples": '[{"input": "madam", "output": "True", "explanation": "\"madam\" is the same forwards and backwards."}, {"input": "hello", "output": "False", "explanation": "\"hello\" is not a palindrome."}]'
        },
        {"title": "Factorial of a Number", "difficulty": "basic",
         "description": "Given a number N, compute its factorial (N!). The factorial of a number is the product of all positive integers less than or equal to N. Factorials are widely used in combinatorics, probability, and recursion problems.",
         "solution": "Multiply all numbers from 1 to N.",
         "examples": '[{"input": "5", "output": "120", "explanation": "5! = 5*4*3*2*1 = 120."}, {"input": "3", "output": "6", "explanation": "3! = 3*2*1 = 6."}]'
        },
        {"title": "Fibonacci Sequence up to N", "difficulty": "basic",
         "description": "Print the Fibonacci sequence up to N terms. The Fibonacci sequence starts with 0 and 1, and each subsequent number is the sum of the previous two. This sequence is fundamental in recursion and dynamic programming.",
         "solution": "Start with 0,1 and add previous two numbers.",
         "examples": '[{"input": "5", "output": "0, 1, 1, 2, 3", "explanation": "First 5 Fibonacci numbers."}, {"input": "7", "output": "0, 1, 1, 2, 3, 5, 8", "explanation": "First 7 Fibonacci numbers."}]'
        },
        {"title": "Sum of Digits", "difficulty": "basic",
         "description": "Given a number, find the sum of its digits. This operation is useful in digital root calculations and number theory. The number can be positive or negative, but only the digits are summed.",
         "solution": "Convert number to string and sum the digits.",
         "examples": '[{"input": "123", "output": "6", "explanation": "1+2+3=6."}, {"input": "-456", "output": "15", "explanation": "4+5+6=15."}]'
        },
        {"title": "Count Vowels in String", "difficulty": "basic",
         "description": "Given a string, count the number of vowels (a, e, i, o, u). This is a basic string traversal problem and helps in understanding character operations. The string may contain uppercase and lowercase letters.",
         "solution": "Iterate and count 'a','e','i','o','u'.",
         "examples": '[{"input": "hello", "output": "2", "explanation": "e and o are vowels."}, {"input": "sky", "output": "0", "explanation": "No vowels in \"sky\"."}]'
        },
        {"title": "Second Largest in Array", "difficulty": "basic",
         "description": "Find the second largest element in an array. This problem tests your ability to traverse and compare elements efficiently. The array may contain duplicates, but the second largest should be unique.",
         "solution": "Sort and pick second last, or track two largest values.",
         "examples": '[{"input": "[1, 3, 2]", "output": "2", "explanation": "3 is largest, 2 is second largest."}, {"input": "[5, 5, 4, 1]", "output": "4", "explanation": "5 is largest, 4 is second largest."}]'
        },
        {"title": "Check Prime Number", "difficulty": "basic",
         "description": "Check if a number is prime. A prime number is only divisible by 1 and itself. This is a classic problem in number theory and helps in understanding loops and conditionals.",
         "solution": "Check divisibility from 2 to sqrt(n).",
         "examples": '[{"input": "7", "output": "True", "explanation": "7 is only divisible by 1 and 7."}, {"input": "8", "output": "False", "explanation": "8 is divisible by 2 and 4."}]'
        },
        {"title": "Remove Duplicates from Array", "difficulty": "basic",
         "description": "Remove duplicate elements from an array. This is a common data cleaning operation and helps in understanding sets and unique value extraction.",
         "solution": "Use set() or track seen elements.",
         "examples": '[{"input": "[1, 2, 2, 3]", "output": "[1, 2, 3]", "explanation": "2 is removed as duplicate."}, {"input": "[4, 4, 4, 4]", "output": "[4]", "explanation": "All duplicates removed, only one 4 remains."}]'
        },
        # Intermediate
        {"title": "Merge Two Sorted Arrays", "difficulty": "intermediate",
         "description": "Given two sorted arrays, merge them into a single sorted array. The resulting array should also be sorted. This problem is fundamental in understanding the merge step of merge sort and efficient array manipulation. Try to solve it with minimal extra space and in linear time.",
         "solution": "Use two pointers to merge into a new array.",
         "examples": '[{"input": "[1,3,5], [2,4,6]", "output": "[1,2,3,4,5,6]", "explanation": "Both arrays are merged in sorted order."}, {"input": "[1,2], [3,4]", "output": "[1,2,3,4]", "explanation": "Arrays are concatenated and sorted."}]'
        },
        {"title": "Intersection of Two Arrays", "difficulty": "intermediate",
         "description": "Find the intersection of two arrays, i.e., elements that appear in both arrays. The result should not contain duplicates. This problem is useful for understanding set operations and efficient searching.",
         "solution": "Use set intersection or nested loops.",
         "examples": '[{"input": "[1,2,3], [2,3,4]", "output": "[2,3]", "explanation": "2 and 3 are common to both arrays."}, {"input": "[5,6], [7,8]", "output": "[]", "explanation": "No common elements."}]'
        },
        {"title": "Binary Search", "difficulty": "intermediate",
         "description": "Implement binary search for a sorted array. Return the index of the target element if found, otherwise return -1. Binary search is a classic algorithm for efficient searching in sorted data, with logarithmic time complexity.",
         "solution": "Check middle, then left or right half recursively or iteratively.",
         "examples": '[{"input": "[1,2,3,4,5], 3", "output": "2", "explanation": "3 is at index 2."}, {"input": "[10,20,30,40], 25", "output": "-1", "explanation": "25 is not present in the array."}]'
        },
        {"title": "First Non-Repeating Character", "difficulty": "intermediate",
         "description": "Find the first non-repeating character in a string. This problem is common in string manipulation and helps in understanding hash maps and frequency counting.",
         "solution": "Use a hash map to count occurrences.",
         "examples": '[{"input": "aabbcde", "output": "c", "explanation": "c is the first character that does not repeat."}, {"input": "aabbcc", "output": "", "explanation": "All characters repeat."}]'
        },
        {"title": "Rotate Array by K", "difficulty": "intermediate",
         "description": "Rotate an array to the right by K steps. The elements that fall off the end should wrap around to the front. This problem is useful for understanding array manipulation and modular arithmetic.",
         "solution": "Reverse parts of the array or use slicing.",
         "examples": '[{"input": "[1,2,3,4,5], K=2", "output": "[4,5,1,2,3]", "explanation": "Array is rotated right by 2 steps."}, {"input": "[10,20,30], K=1", "output": "[30,10,20]", "explanation": "Array is rotated right by 1 step."}]'
        },
        {"title": "Longest Common Prefix", "difficulty": "intermediate",
         "description": "Find the longest common prefix among an array of strings. This is a classic string problem that helps in understanding string comparison and prefix trees (tries).",
         "solution": "Compare characters of all strings at each position.",
         "examples": '[{"input": "[\"flower\",\"flow\",\"flight\"]", "output": "fl", "explanation": "\"fl\" is the common prefix."}, {"input": "[\"dog\",\"racecar\",\"car\"]", "output": "", "explanation": "No common prefix."}]'
        },
        {"title": "Stack Using Arrays", "difficulty": "intermediate",
         "description": "Implement a stack using arrays with push, pop, and top operations. Stacks are fundamental data structures used in parsing, backtracking, and function calls.",
         "solution": "Use a list with append and pop methods.",
         "examples": '[{"input": "push 1, push 2, pop", "output": "1", "explanation": "2 is pushed then popped, 1 remains."}, {"input": "push 5, pop, pop", "output": "Error or empty", "explanation": "Stack is empty after two pops."}]'
        },
        {"title": "Find Missing Number", "difficulty": "intermediate",
         "description": "Given an array of size N-1 containing numbers from 1 to N, find the missing number. This is a classic problem in array manipulation and arithmetic.",
         "solution": "Sum 1 to N and subtract array sum.",
         "examples": '[{"input": "[1,2,4,5], N=5", "output": "3", "explanation": "3 is missing from 1 to 5."}, {"input": "[2,3,1,5], N=5", "output": "4", "explanation": "4 is missing."}]'
        },
        {"title": "Balanced Parentheses", "difficulty": "intermediate",
         "description": "Check if an expression has balanced parentheses. This problem is important in parsing and compiler design. Use a stack to track open and close parentheses.",
         "solution": "Use a stack to track open and close parentheses.",
         "examples": '[{"input": "(()())", "output": "True", "explanation": "Parentheses are balanced."}, {"input": "(()", "output": "False", "explanation": "Unmatched open parenthesis."}]'
        },
        {"title": "Pairs with Given Sum", "difficulty": "intermediate",
         "description": "Find all pairs in an array that sum up to a given value. This problem is useful for understanding hash sets and two-pointer techniques.",
         "solution": "Use a hash set to check for complement.",
         "examples": '[{"input": "[1,2,3,4], sum=5", "output": "[(1,4),(2,3)]", "explanation": "Pairs (1,4) and (2,3) sum to 5."}, {"input": "[2,4,6], sum=8", "output": "[(2,6)]", "explanation": "Only (2,6) sums to 8."}]'
        },
        # Advanced
        {"title": "Longest Increasing Subsequence", "difficulty": "advanced",
         "description": "Find the length of the longest increasing subsequence in an array. This is a classic dynamic programming problem and helps in understanding subsequence and sequence analysis.",
         "solution": "Use dynamic programming to track LIS ending at each index.",
         "examples": '[{"input": "[10,9,2,5,3,7,101,18]", "output": "4", "explanation": "The LIS is [2,3,7,101]."}, {"input": "[0,1,0,3,2,3]", "output": "4", "explanation": "The LIS is [0,1,2,3]."}]'
        },
        {"title": "LRU Cache", "difficulty": "advanced",
         "description": "Design and implement a Least Recently Used (LRU) cache. This data structure is used to manage memory efficiently by discarding the least recently accessed items first. It is commonly used in operating systems and web browsers.",
         "solution": "Use OrderedDict or a doubly linked list with a hash map.",
         "examples": '[{"input": "put(1,1), put(2,2), get(1), put(3,3), get(2)", "output": "-1", "explanation": "2 was least recently used and evicted."}, {"input": "put(2,1), put(2,2), get(2)", "output": "2", "explanation": "2 is updated and returned."}]'
        },
        {"title": "Dijkstra's Shortest Path", "difficulty": "advanced",
         "description": "Find the shortest path in a graph using Dijkstra's algorithm. This is a fundamental graph algorithm used in routing and network analysis.",
         "solution": "Use a priority queue to pick the next closest node.",
         "examples": '[{"input": "Graph: 0-1(4), 0-2(1), 2-1(2), 1-3(1), 2-3(5); start=0", "output": "0->2->1->3, cost=4", "explanation": "Shortest path from 0 to 3 is 0->2->1->3."}, {"input": "Graph: 0-1(1), 1-2(1), 0-2(4); start=0", "output": "0->1->2, cost=2", "explanation": "Shortest path from 0 to 2 is 0->1->2."}]'
        },
        {"title": "Cycle in Linked List", "difficulty": "advanced",
         "description": "Detect if a linked list has a cycle. This is a classic problem in linked list manipulation and helps in understanding pointers and Floyd's cycle detection algorithm.",
         "solution": "Use slow and fast pointers (Floyd's algorithm).",
         "examples": '[{"input": "1->2->3->4->2 (cycle)", "output": "True", "explanation": "There is a cycle."}, {"input": "1->2->3->4 (no cycle)", "output": "False", "explanation": "No cycle present."}]'
        },
        {"title": "Kth Largest Element", "difficulty": "advanced",
         "description": "Find the kth largest element in an array. This problem is important for understanding heaps and order statistics.",
         "solution": "Use a min-heap of size k or sort and pick.",
         "examples": '[{"input": "[3,2,1,5,6,4], k=2", "output": "5", "explanation": "5 is the 2nd largest element."}, {"input": "[7,10,4,3,20,15], k=3", "output": "10", "explanation": "10 is the 3rd largest element."}]'
        },
        {"title": "Trie (Prefix Tree)", "difficulty": "advanced",
         "description": "Implement a Trie with insert, search, and startsWith methods. Tries are efficient for prefix-based searching and are widely used in autocomplete systems.",
         "solution": "Use a tree of nodes for each character.",
         "examples": '[{"input": "insert(\"apple\"), search(\"apple\")", "output": "True", "explanation": "\"apple\" was inserted and found."}, {"input": "insert(\"app\"), search(\"apple\")", "output": "False", "explanation": "\"apple\" was not inserted."}]'
        },
        {"title": "Strongly Connected Components", "difficulty": "advanced",
         "description": "Find all strongly connected components in a directed graph. This is a key problem in graph theory and is used in many applications such as circuit analysis and social networks.",
         "solution": "Use Kosaraju's or Tarjan's algorithm.",
         "examples": '[{"input": "Graph: 0->1, 1->2, 2->0, 1->3", "output": "[[0,1,2],[3]]", "explanation": "Nodes 0,1,2 form a strongly connected component."}, {"input": "Graph: 0->1, 1->2, 2->3", "output": "[[0],[1],[2],[3]]", "explanation": "Each node is its own SCC."}]'
        },
        {"title": "Word Break Problem", "difficulty": "advanced",
         "description": "Given a string and a dictionary, determine if the string can be segmented into a space-separated sequence of dictionary words. This is a classic dynamic programming problem in string segmentation.",
         "solution": "Use dynamic programming to check all prefixes.",
         "examples": '[{"input": "s=\"leetcode\", wordDict=[\"leet\",\"code\"]", "output": "True", "explanation": "\"leetcode\" can be segmented as \"leet code\"."}, {"input": "s=\"applepenapple\", wordDict=[\"apple\",\"pen\"]", "output": "True", "explanation": "\"applepenapple\" can be segmented as \"apple pen apple\"."}]'
        },
        {"title": "Serialize and Deserialize Binary Tree", "difficulty": "advanced",
         "description": "Design algorithms to serialize and deserialize a binary tree. Serialization is converting a tree to a string, and deserialization is converting it back. This is important for storing and transmitting tree structures.",
         "solution": "Use preorder traversal with null markers.",
         "examples": '[{"input": "[1,2,3,null,null,4,5]", "output": "\"1,2,null,null,3,4,null,null,5,null,null\"", "explanation": "Serialized preorder with nulls."}, {"input": "[1]", "output": "\"1,null,null\"", "explanation": "Single node tree."}]'
        },
        {"title": "Median of Two Sorted Arrays", "difficulty": "advanced",
         "description": "Find the median of two sorted arrays. This is a challenging problem that requires efficient partitioning and binary search techniques.",
         "solution": "Use binary search to partition arrays.",
         "examples": '[{"input": "[1,3], [2]", "output": "2.0", "explanation": "Median is 2."}, {"input": "[1,2], [3,4]", "output": "2.5", "explanation": "Median is (2+3)/2=2.5."}]'
        },
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