import pandas as pd
from sklearn.model_selection import train_test_split
from transformers import BertTokenizer, BertForSequenceClassification, Trainer, TrainingArguments
from torch.utils.data import Dataset
import torch

class TextDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=128):
        self.encodings = tokenizer(texts, truncation=True, padding=True, max_length=max_len)
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item["labels"] = torch.tensor(self.labels[idx])
        return item

    def __len__(self):
        return len(self.labels)

# Load dataset (Download from Kaggle: Davidson Hate Speech Dataset)
# https://www.kaggle.com/datasets/mrmorj/hate-speech-and-offensive-language-dataset
df = pd.read_csv("data/hate_speech.csv")

# Convert labels: 1 = abusive/offensive/hate, 0 = clean
df["label"] = df["class"].apply(lambda x: 1 if x != 2 else 0)

train_texts, val_texts, train_labels, val_labels = train_test_split(
    df["tweet"], df["label"], test_size=0.2, random_state=42
)

tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
train_dataset = TextDataset(train_texts.tolist(), train_labels.tolist(), tokenizer)
val_dataset = TextDataset(val_texts.tolist(), val_labels.tolist(), tokenizer)

model = BertForSequenceClassification.from_pretrained("bert-base-uncased", num_labels=2)

args = TrainingArguments(
    output_dir="./bert-results",
    evaluation_strategy="epoch",
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=2,
    save_strategy="epoch"
)

trainer = Trainer(
    model=model,
    args=args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset
)

trainer.train()

model.save_pretrained("bert_model")
tokenizer.save_pretrained("bert_model")

print("✅ BERT model trained and saved in bert_model/")
