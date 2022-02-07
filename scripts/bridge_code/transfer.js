const config = require("./config");
const Web3 = require("web3");
// console.log(config.chain_rpc_url);
const web3 = new Web3(config.chain_rpc_url);
const ABI = require("./bridge.json")["abi"];
// console.log(config.matic_contract_addresss);
const CONTRACT_ADDRESS = config.matic_contract_addresss;
const myContract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

let options = {
    filter: {
        value: [],
    },
    fromBlock: 0,
};

const { pos } = require("./config");
const { getPOSClient, to, from } = require("./utils");

const sleep = ms => new Promise(r => setTimeout(r, ms));

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
    while (await client.isCheckPointed(txHash) != true) {
        console.log('Waiting for checkpoint. Sleeping for 1 min');
        await sleep(60000);        
    }

    // const isCheckPointed = await client.isCheckPointed(txHash);

    // console.log(isCheckPointed);

    const erc20RootToken = client.erc20("0x0000000000000000000000000000000000000000", true);

    // exit the withdraw, happens in ethereum
    result = await erc20RootToken.withdrawExit(txHash);

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


while (true) {
    await sleep(100);
    myContract.getPastEvents(
        "TransferRequestPlaced",
        {
            fromBlock: let latest_block = await web3.eth.getBlockNumber(),
            toBlock: "latest",
        },
        function (error, events) {
            console.log(events);            
        }
    );
};