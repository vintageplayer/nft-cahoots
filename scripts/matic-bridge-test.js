import { POSClient,use } from "@maticnetwork/maticjs"
import { Web3ClientPlugin } from '@maticnetwork/maticjs-web3'
import HDWalletProvider from "@truffle/hdwallet-provider"

// install web3 plugin
use(Web3ClientPlugin);

const rinkebyProvider = new HDWalletProvider({
    mnemonic: mnemonicPhrase,
    providerOrUrl: "https://rinkeby.infura.io/v3/85db4049c00b4783a425412807ff92e9",
    addressIndex: 0,
  });

  const mumbaiProvider = new HDWalletProvider({
    mnemonic: mnemonicPhrase,
    providerOrUrl: "https://polygon-mumbai.infura.io/v3/85db4049c00b4783a425412807ff92e9",
    addressIndex: 0,
  });

const fromAddress = "0x3CA39Cc540b972EF0E84DC67E4894Aa745153EB3";

const posClient = new POSClient();
await posClient.init({
    network: 'testnet',
    version: 'mumbai',
    parent: {
      provider: mumbaiProvider,
      defaultConfig: {
        from : fromAddress
      }
    },
    child: {
      provider: rinkebyProvider,
      defaultConfig: {
        from : fromAddress
      }
    }
});


