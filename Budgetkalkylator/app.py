import tkinter as tk
from tkinter import messagebox, Scrollbar

def set_income():
    try:
        global income
        income = float(income_entry.get())
        balance_var.set(f"Saldo: {income:.2f} kr")
        income_entry.delete(0, tk.END)
    except ValueError:
        messagebox.showerror("Fel", "Ange en giltig inkomst")

def add_expense():
    try:
        global income
        expense_name = expense_name_entry.get()
        expense = float(expense_entry.get())
        if expense > income:
            messagebox.showwarning("Varning", "Utgiften överstiger din inkomst!")
        else:
            income -= expense
            balance_var.set(f"Saldo: {income:.2f} kr")
            create_expense_item(expense_name, expense)
        expense_name_entry.delete(0, tk.END)
        expense_entry.delete(0, tk.END)
    except ValueError:
        messagebox.showerror("Fel", "Ange en giltig utgift")

def remove_expense(frame, expense):
    global income
    income += expense
    balance_var.set(f"Saldo: {income:.2f} kr")
    frame.destroy()
    update_scroll_region()

def create_expense_item(name, amount):
    frame = tk.Frame(expense_list_frame, bg="#ffffff", pady=8, padx=10, relief=tk.GROOVE, borderwidth=2)
    frame.pack(fill="x", pady=8, padx=10, expand=True)
    
    label = tk.Label(frame, text=f"{name}: {amount:.2f} kr", anchor="w", bg="#ffffff", font=("Arial", 12, "bold"), fg="#2c3e50")
    label.pack(side="left", expand=True, fill="x", padx=15)
    
    remove_button = tk.Button(frame, text="✖", command=lambda: remove_expense(frame, amount), width=3, fg="white", bg="#e74c3c", font=("Arial", 12, "bold"), relief=tk.FLAT, cursor="hand2")
    remove_button.pack(side="right", padx=15, pady=8)
    
    update_scroll_region()

def update_scroll_region():
    canvas.update_idletasks()
    canvas.configure(scrollregion=canvas.bbox("all"))

def update_expense_width(event):
    canvas_width = right_frame.winfo_width() - scrollbar.winfo_width() - 10
    canvas.itemconfig(expense_list_window, width=canvas_width)
    for frame in expense_list_frame.winfo_children():
        frame.config(width=canvas_width)
    update_scroll_region()

# Skapa GUI
root = tk.Tk()
root.title("Budgeträknare")
root.geometry("900x600")
root.configure(bg="#0D1B2A")

income = 0.0

main_frame = tk.Frame(root, bg="#0D1B2A")
main_frame.pack(fill="both", expand=True, padx=30, pady=30)

left_frame = tk.Frame(main_frame, bg="#0D1B2A")
left_frame.pack(side="left", fill="both", expand=True, padx=30, pady=30)

right_frame = tk.Frame(main_frame, bg="#0D1B2A")
right_frame.pack(side="right", fill="both", expand=True, padx=30, pady=30)
right_frame.bind("<Configure>", update_expense_width)

# Inkomst
tk.Label(left_frame, text="Ange inkomst:", bg="#0D1B2A", fg="white", font=("Arial", 13, "bold")).pack()
income_entry = tk.Entry(left_frame, font=("Arial", 12), relief=tk.FLAT, bd=3, width=20)
income_entry.pack(pady=8)
tk.Button(left_frame, text="Sätt inkomst", command=set_income, font=("Arial", 12, "bold"), bg="#1B263B", fg="white", relief=tk.FLAT, cursor="hand2", width=15).pack(pady=5)

# Utgifter
tk.Label(left_frame, text="Utgiftsnamn:", bg="#0D1B2A", fg="white", font=("Arial", 13, "bold")).pack()
expense_name_entry = tk.Entry(left_frame, font=("Arial", 12), relief=tk.FLAT, bd=3, width=20)
expense_name_entry.pack(pady=8)
tk.Label(left_frame, text="Ange utgift:", bg="#0D1B2A", fg="white", font=("Arial", 13, "bold")).pack()
expense_entry = tk.Entry(left_frame, font=("Arial", 12), relief=tk.FLAT, bd=3, width=20)
expense_entry.pack(pady=8)
tk.Button(left_frame, text="Lägg till utgift", command=add_expense, font=("Arial", 12, "bold"), bg="#1B263B", fg="white", relief=tk.FLAT, cursor="hand2", width=15).pack(pady=8)

# Saldo
balance_var = tk.StringVar()
balance_var.set("Saldo: 0.00 kr")
balance_label = tk.Label(left_frame, textvariable=balance_var, font=("Arial", 18, "bold"), bg="#0D1B2A", fg="#00D4FF")
balance_label.pack(pady=20)

# Lista över utgifter
tk.Label(right_frame, text="Utgifter:", bg="#0D1B2A", fg="white", font=("Arial", 16, "bold")).pack()

canvas = tk.Canvas(right_frame, bg="#0D1B2A")
scrollbar = Scrollbar(right_frame, orient="vertical", command=canvas.yview)
canvas.configure(yscrollcommand=scrollbar.set)
canvas.pack(side="left", fill="both", expand=True)
scrollbar.pack(side="right", fill="y")

expense_list_frame = tk.Frame(canvas, bg="#0D1B2A")
expense_list_window = canvas.create_window((0, 0), window=expense_list_frame, anchor="nw", width=right_frame.winfo_width() - scrollbar.winfo_width() - 10)
expense_list_frame.bind("<Configure>", lambda e: update_scroll_region())

root.mainloop()
