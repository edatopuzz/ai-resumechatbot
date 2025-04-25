from dotenv import load_dotenv
from convex import ConvexClient
import os

# Load environment variables
load_dotenv("../.env")

# Initialize Convex client
convex = ConvexClient(os.getenv("NEXT_PUBLIC_CONVEX_URL"))

def verify_documents():
    try:
        # Get all documents
        documents = convex.query("documents:listDocuments")
        
        print(f"\nFound {len(documents)} documents in the database:")
        print("-" * 50)
        
        for doc in documents:
            print(f"\nDocument ID: {doc['_id']}")
            print(f"Name: {doc['name']}")
            print(f"Content length: {len(doc['content'])} characters")
            print(f"Embedding length: {len(doc['embedding'])} dimensions")
            print("-" * 50)
            
    except Exception as e:
        print(f"Error verifying documents: {str(e)}")
        raise

if __name__ == "__main__":
    verify_documents() 