const { pos } = require("./config");
const { getPOSClient, to, from } = require("./utils");

const execute = async () => {
    const client = await getPOSClient();

    // get erc20Token instance
    const erc20Token = client.erc20(pos.child.weth1, false);
    console.log(pos.child.weth);

    // [OPTIONAL] check balance
    const balance = await erc20Token.getBalance(from);
    console.log(from);
    console.log("balance: ", balance);

    // Start withdraw - this is in mumbai
    let result = await erc20Token.withdrawStart(21);

    let txHash = await result.getTransactionHash();
    console.log("txHash", txHash);
    let txReceipt = await result.getReceipt();

    console.log("receipt", txReceipt);

    // Check if checkpoint is reached
    const isCheckPointed = await client.isCheckPointed(
        "0x3b970b3999e197f804b59ec56a173df8a2729f84666ec963728891f6148653ef"
    );

    console.log(isCheckPointed);

    const erc20RootToken = client.erc20("0x0000000000000000000000000000000000000000", true);

    // exit the withdraw, happens in ethereum
    result = await erc20RootToken.withdrawExit("0x3b970b3999e197f804b59ec56a173df8a2729f84666ec963728891f6148653ef");

    txHash = await result.getTransactionHash();
    console.log("txHash", txHash);

    txReceipt = await result.getReceipt();

    console.log("receipt", txReceipt);
};
execute()
    .then(() => {})
    .catch((err) => {
        console.error("err", err);
    })
    .finally((_) => {
        process.exit(0);
    });
