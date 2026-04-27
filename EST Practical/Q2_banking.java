import java.util.HashMap;
import java.util.Map;

class BankAccount {
    private String accountNumber;
    private double balance;

    public BankAccount(String accountNumber, double initialBalance) {
        this.accountNumber = accountNumber;
        this.balance = initialBalance;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public double getBalance() {
        return balance;
    }

    public void depositAmount(double amount) {
        balance += amount;
    }

    public void withdrawAmount(double amount) {
        if (amount <= balance) {
            balance -= amount;
        }
    }
}

class AccountRepository {
    private Map<String, BankAccount> accountStorage = new HashMap<>();

    public void saveAccount(BankAccount account) {
        accountStorage.put(account.getAccountNumber(), account);
    }

    public BankAccount findAccount(String accountNumber) {
        return accountStorage.get(accountNumber);
    }
}

class TransactionService {
    private AccountRepository accountRepository;

    public TransactionService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public void deposit(String accountNumber, double amount) {
        BankAccount account = accountRepository.findAccount(accountNumber);
        if (account != null) {
            account.depositAmount(amount);
        }
    }

    public void withdraw(String accountNumber, double amount) {
        BankAccount account = accountRepository.findAccount(accountNumber);
        if (account != null) {
            account.withdrawAmount(amount);
        }
    }
}

class AccountService {
    private AccountRepository accountRepository;

    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public void createAccount(String accountNumber, double initialBalance) {
        BankAccount account = new BankAccount(accountNumber, initialBalance);
        accountRepository.saveAccount(account);
    }
}

public class Main {
    public static void main(String[] args) {
        AccountRepository accountRepository = new AccountRepository();
        AccountService accountService = new AccountService(accountRepository);
        TransactionService transactionService = new TransactionService(accountRepository);

        accountService.createAccount("A101", 1000);

        transactionService.deposit("A101", 500);
        transactionService.withdraw("A101", 200);

        BankAccount account = accountRepository.findAccount("A101");
        System.out.println(account.getBalance());
    }
}
