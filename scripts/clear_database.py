import os
from pathlib import Path
from dotenv import load_dotenv
from convex import ConvexClient

# Get the absolute path to the script's directory
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

# Load environment variables
env_path = PROJECT_ROOT / ".env"
load_dotenv(env_path)

# Initialize Convex client
convex = ConvexClient(os.getenv("NEXT_PUBLIC_CONVEX_URL"))

def clear_all_documents():
    """Clear all documents from the database."""
    try:
        print("🗑️  CLEARING DATABASE")
        print("=" * 40)
        
        # Get count of documents first
        documents = convex.query("documents:listDocuments")
        doc_count = len(documents)
        print(f"📊 Found {doc_count} documents to delete")
        
        if doc_count == 0:
            print("✅ Database is already empty!")
            return
        
        # Confirm deletion
        confirm = input(f"\n⚠️  Are you sure you want to delete ALL {doc_count} documents? (yes/no): ")
        if confirm.lower() != 'yes':
            print("❌ Deletion cancelled")
            return
        
        # Clear all documents using the batch function
        print("🗑️  Deleting all documents...")
        result = convex.mutation("documents:clearAllDocuments")
        
        print(f"\n✅ Successfully deleted {result['deleted']} documents!")
        print("🧹 Database is now clean and ready for fresh semantic chunks!")
        
    except Exception as e:
        print(f"❌ Error clearing database: {str(e)}")
        raise

if __name__ == "__main__":
    clear_all_documents() 