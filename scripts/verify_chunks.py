import os
from pathlib import Path
from dotenv import load_dotenv
from convex import ConvexClient
import json

# Load environment variables
load_dotenv("../.env")

# Initialize Convex client
convex = ConvexClient(os.getenv("NEXT_PUBLIC_CONVEX_URL"))

def verify_chunks():
    """Verify the stored chunks in the database."""
    try:
        # Get all documents
        documents = convex.query("documents:list", {})
        
        print(f"\nFound {len(documents)} documents in the database:")
        print("-" * 50)
        
        for doc in documents:
            print(f"\nDocument ID: {doc['_id']}")
            print(f"Name: {doc['name']}")
            print(f"Content Preview: {doc['content'][:200]}...")  # Show first 200 characters
            print(f"Embedding Length: {len(doc['embedding'])}")
            print("-" * 50)
            
    except Exception as e:
        print(f"Error verifying chunks: {str(e)}")
        raise

if __name__ == "__main__":
    verify_chunks() 