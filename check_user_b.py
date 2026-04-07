import pandas as pd
import numpy as np

CSV_PATH = r"f:\FINAL-YEAR-PROJECT-DRAFT1 - Copy\guardian-pay-main\data\user_transactions.csv"
OUT_PATH = r"f:\FINAL-YEAR-PROJECT-DRAFT1 - Copy\guardian-pay-main\diag_out.txt"

def check_user_b():
    with open(OUT_PATH, "w", encoding='utf-8') as f:
        try:
            df = pd.read_csv(CSV_PATH)
            df_user = df[df['user_id'] == 'B'].copy()
            
            f.write(f"Total rows for User B: {len(df_user)}\n")
            
            df_user['amount'] = pd.to_numeric(df_user['amount'], errors='coerce')
            df_user = df_user.dropna(subset=['amount'])
            
            f.write(f"Rows with valid amount: {len(df_user)}\n")
            
            f.write("Sample raw dates:\n")
            f.write(str(df_user['date'].head(20)) + "\n")
            
            df_user['date_str'] = df_user['date'].astype(str).str.strip()
            df_user['parsed_date'] = pd.to_datetime(df_user['date_str'], dayfirst=True, errors='coerce')
            
            dropped = df_user[df_user['parsed_date'].isna()]
            f.write(f"Total dropped dates: {len(dropped)}\n")
            if not dropped.empty:
                f.write("Sample dropped date values:\n")
                f.write(str(dropped['date'].unique()[:50]) + "\n")

            valid = df_user[df_user['parsed_date'].notna()]
            f.write(f"Total valid dates: {len(valid)}\n")
            
            if not valid.empty:
                mean_val = valid['amount'].mean()
                std_val = valid['amount'].std()
                f.write(f"Mean: {mean_val}, Std: {std_val}\n")
                
                valid['z_score'] = (valid['amount'] - mean_val) / (std_val if std_val > 0 else 1.0)
                spikes = valid[valid['amount'] > 5000].copy()
                f.write("Spikes (> 5000):\n")
                f.write(str(spikes[['date', 'amount', 'z_score']]) + "\n")
                
        except Exception as e:
            f.write(f"Error: {e}\n")

if __name__ == "__main__":
    check_user_b()
