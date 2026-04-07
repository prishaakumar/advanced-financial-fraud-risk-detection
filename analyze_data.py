import pandas as pd
import os
import json

data_dir = r"f:\FINAL-YEAR-PROJECT-DRAFT1 - Copy\guardian-pay-main\data"

def analyze_file(filename):
    path = os.path.join(data_dir, filename)
    if not os.path.exists(path):
        return {"error": "file not found"}
    try:
        df = pd.read_csv(path)
        return {
            "columns": df.columns.tolist(),
            "shape": df.shape,
            "head": df.head(5).to_dict(orient='records')
        }
    except Exception as e:
        return {"error": str(e)}

results = {}
files = ["upi_transactions_2024.csv", "user-A-statement.csv", "user-B-statement.csv"]
for f in files:
    results[f] = analyze_file(f)

print(json.dumps(results, indent=2))

# Now merge user statements
def process_statement(filename, user_id):
    path = os.path.join(data_dir, filename)
    df = pd.read_csv(path)
    # Expected: user_id,date,receiver,amount,type
    # Statement columns based on previous garbled output: Date, Remarks/Details, Debit, Credit, Balance
    
    new_df = pd.DataFrame()
    # Normalize column names
    df.columns = [c.strip() for c in df.columns]
    
    # Map Date
    if 'Date' in df.columns:
        new_df['date'] = df['Date']
    
    # Map Receiver (Remarks or Details)
    if 'Remarks' in df.columns:
        new_df['receiver'] = df['Remarks']
    elif 'Details' in df.columns:
        new_df['receiver'] = df['Details']
    
    # Map Amount and Type
    amounts = []
    types = []
    for idx, row in df.iterrows():
        debit = str(row.get('Debit', '')).replace('₹', '').replace(',', '').strip()
        credit = str(row.get('Credit', '')).replace('₹', '').replace(',', '').strip()
        
        try:
            d_val = float(debit) if debit and debit != 'nan' else 0
        except:
            d_val = 0
            
        try:
            c_val = float(credit) if credit and credit != 'nan' else 0
        except:
            c_val = 0
            
        if d_val > 0:
            amounts.append(d_val)
            types.append('debit')
        elif c_val > 0:
            amounts.append(c_val)
            types.append('credit')
        else:
            amounts.append(0)
            types.append('other')
            
    new_df['amount'] = amounts
    new_df['type'] = types
    new_df['user_id'] = user_id
    
    return new_df

df_a = process_statement("user-A-statement.csv", "A")
df_b = process_statement("user-B-statement.csv", "B")

merged = pd.concat([df_a, df_b], ignore_index=True)
merged.to_csv(os.path.join(data_dir, "user_transactions.csv"), index=False)
print(f"Merged user transactions saved to user_transactions.csv. Shape: {merged.shape}")
