const web3 = require('web3');
const { getPOSClient, from } = require("./utils");

const execute = async () => {
  const client = await getPOSClient();
  const result = await client.depositEther(web3.utils.toWei('2', 'ether'), from);
  // const result = await client.depositEther(9000000000000000, from);

  const txHash = await result.getTransactionHash();
  console.log("txHash", txHash);
  const receipt = await result.getReceipt();
  console.log("receipt", receipt);
};

execute()
  .then(() => {})
  .catch((err) => {
    console.error("err", err);
  })
  .finally((_) => {
    process.exit(0);
  });