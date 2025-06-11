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

def check_semantic_chunks():
    """Check and display the semantic chunks stored in the database."""
    try:
        # Get all documents using the correct query function
        documents = convex.query("documents:listDocuments")
        
        print(f"\n🔍 SEMANTIC CHUNKING VERIFICATION")
        print(f"=" * 60)
        print(f"📊 Total documents in database: {len(documents)}")
        
        # Separate full documents from semantic chunks
        full_documents = []
        semantic_chunks = []
        
        for doc in documents:
            if "semantic_chunk" in doc['name']:
                semantic_chunks.append(doc)
            else:
                full_documents.append(doc)
        
        print(f"📄 Full documents: {len(full_documents)}")
        print(f"🧠 Semantic chunks: {len(semantic_chunks)}")
        print(f"=" * 60)
        
        # Display full documents
        print(f"\n📄 FULL DOCUMENTS:")
        print(f"-" * 40)
        for doc in full_documents:
            print(f"Name: {doc['name']}")
            print(f"ID: {doc['_id']}")
            print(f"Content length: {len(doc['content'])} characters")
            print(f"Embedding dimensions: {len(doc['embedding'])}")
            print(f"Preview: {doc['content'][:150]}...")
            print(f"-" * 40)
        
        # Display semantic chunks grouped by source
        print(f"\n🧠 SEMANTIC CHUNKS:")
        print(f"-" * 40)
        
        # Group chunks by source document
        resume_chunks = [doc for doc in semantic_chunks if "resume" in doc['name']]
        answers_chunks = [doc for doc in semantic_chunks if "suggested_answers" in doc['name']]
        
        if resume_chunks:
            print(f"\n📋 RESUME SEMANTIC CHUNKS ({len(resume_chunks)} chunks):")
            for i, chunk in enumerate(sorted(resume_chunks, key=lambda x: x['name'])):
                chunk_num = chunk['name'].split('_')[-1]
                print(f"  Chunk {chunk_num}: {len(chunk['content'])} chars")
                print(f"    Preview: {chunk['content'][:100]}...")
                print(f"    ID: {chunk['_id']}")
                print()
        
        if answers_chunks:
            print(f"\n💬 SUGGESTED ANSWERS SEMANTIC CHUNKS ({len(answers_chunks)} chunks):")
            for i, chunk in enumerate(sorted(answers_chunks, key=lambda x: x['name'])):
                chunk_num = chunk['name'].split('_')[-1]
                print(f"  Chunk {chunk_num}: {len(chunk['content'])} chars")
                print(f"    Preview: {chunk['content'][:100]}...")
                print(f"    ID: {chunk['_id']}")
                print()
        
        # Summary statistics
        if semantic_chunks:
            chunk_sizes = [len(chunk['content']) for chunk in semantic_chunks]
            avg_size = sum(chunk_sizes) / len(chunk_sizes)
            min_size = min(chunk_sizes)
            max_size = max(chunk_sizes)
            
            print(f"\n📊 SEMANTIC CHUNKING STATISTICS:")
            print(f"  Average chunk size: {avg_size:.0f} characters")
            print(f"  Smallest chunk: {min_size} characters")
            print(f"  Largest chunk: {max_size} characters")
            print(f"  Total semantic chunks: {len(semantic_chunks)}")
        
        print(f"\n✅ Semantic chunking verification complete!")
        print(f"🧠 Your documents are now intelligently chunked based on semantic meaning!")
        
    except Exception as e:
        print(f"❌ Error checking semantic chunks: {str(e)}")
        raise

if __name__ == "__main__":
    check_semantic_chunks() 