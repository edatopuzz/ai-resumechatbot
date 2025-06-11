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

def test_search_query(query: str):
    """Test what documents are retrieved for a specific query."""
    try:
        print(f"\n🔍 TESTING SEARCH QUERY: '{query}'")
        print("=" * 60)
        
        # Use the hybrid search action
        results = convex.action("search:hybridSearch", {"query": query})
        
        print(f"📊 Found {len(results)} documents")
        print("-" * 40)
        
        for i, result in enumerate(results[:10]):  # Show top 10 results
            print(f"\n{i+1}. Document ID: {result['id']}")
            print(f"   Score: {result['score']:.4f}")
            print(f"   Content length: {len(result['text'])} chars")
            print(f"   Preview: {result['text'][:200]}...")
            
            # Try to identify document type
            if "semantic_chunk" in str(result['id']):
                print(f"   Type: Semantic Chunk")
            else:
                print(f"   Type: Full Document")
        
        print(f"\n" + "=" * 60)
        
    except Exception as e:
        print(f"❌ Error testing search: {str(e)}")
        raise

if __name__ == "__main__":
    # Test different types of queries
    test_queries = [
        "Tell me about Eda's AI experience",
        "What is the AI Skills project?",
        "SAP SuccessFactors experience",
        "Project Unify",
        "leadership experience"
    ]
    
    for query in test_queries:
        test_search_query(query)
        print("\n" + "🔄" * 20 + "\n") 