import Vue from "vue";
import Vuex from "vuex";
import fetch from "cross-fetch";
import Web3 from "web3";
import Web3Modal from "web3modal";
import Moralis from "../plugins/moralis";
import axios from "axios";

const collectionABI = require("../contractDetails/collection.json")["abi"];
const fundFactoryABI = require("../contractDetails/FundFactory.json")["abi"];
const nftFundVotingJson = require("../contractDetails/nftFundVoting.json");
const iAuctionHouseAbi = require("../contractDetails/IAuctionHouse.json")["abi"];
const ethAddress = "0x0000000000000000000000000000000000000000";

Vue.use(Vuex);

const providerOptions = {
  /* See Provider Options Section */
};

const web3Modal = new Web3Modal({
  network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions, // required
});

function roundToTwo(num) {
  return +(Math.round(num + "e+2") + "e-2");
}

//gets lowest sale amount from opensea API //NOT IN USE ANYMORE
function findLowestSaleAmount(orders) {
  var lowest_sale_price = 999999;
  for (var i of orders) {
    if (i["side"] == 1) {
      var wei = i["current_price"].split(".")[0];
      var listing_price = Web3.utils.fromWei(wei, "ether");
      if (listing_price < lowest_sale_price) {
        lowest_sale_price = listing_price;
      }
    }
  }
  console.log(lowest_sale_price);
  return roundToTwo(lowest_sale_price);
}

export default new Vuex.Store({
  state: {
    web3: null,
    provider: null,
    accounts: null,
    networkId: null,
    chainId: 0,
    active: false,
    account: null,
    web3Modal: null,
    maticBalance: 0,
    nftListInFund: {},
    collectionList: [],
    collectionDetails: {
      ownerAddress: "",
      contractBalance: 0,
      tokenStartPrice: 0,
      tokenPrice: 0,
      userTokenBalance: 0,
      buyingEnabled: true,
      sellingEnabled: true,
      chain: '',
    },
    nftDetails: {},
    isError: 0,
  },
  getters: {
    getFunds(state) {
      return state.nftFunds;
    },
    getNoOfFunds(state) {
      return state.nftFunds.length;
    },
  },
  mutations: {
    setWeb3(state, web3) {
      state.web3 = web3;
    },
    setWeb3Modal(state, web3Modal) {
      state.web3Modal = web3Modal;
    },
    setProvider(state, provider) {
      state.provider = provider;
    },
    setAccounts(state, accounts) {
      state.accounts = accounts;
    },
    setAccount(state, account) {
      state.account = account;
      state.web3.eth.defaultAccount = account;
    },
    setActive(state, isActive) {
      state.active = isActive;
    },
    setNetworkId(state, networkId) {
      state.networkId = networkId;
    },
    setChainId(state, chainId) {
      state.chainId = chainId;
    },
    setMaticBalance(state, maticBalance) {
      state.maticBalance = maticBalance;
    },
    setNftListInAddress(state, { nftList, fundAddress }) {
      Vue.set(state.nftListInFund, fundAddress, nftList);
    },
    setCollectionList(state, collectionList) {
      state.collectionList = collectionList;
    },
    setCollectionDetails(state, collectionDetails) {
      state.collectionDetails = collectionDetails;
      // Vue.set(state.collectionDetails, ownerAddress, collectionDetails.ownerAddress);
      // Vue.set(state.collectionDetails, tokenStartPrice, collectionDetails.tokenStartPrice);
      // Vue.set(state.collectionDetails, tokenPrice, collectionDetails.tokenPrice);
      // Vue.set(state.collectionDetails, name, collectionDetails.name);
      // Vue.set(state.collectionDetails, symbol, collectionDetails.symbol);
      // Vue.set(state.collectionDetails, userTokenBalance, collectionDetails.userTokenBalance);
      // Vue.set(state.collectionDetails, contractBalance, collectionDetails.contractBalance);
    },
    setNFTList(state, nftList) {
      state.nftDetails = nftList;
    },
    setIsError(state, err) {
      state.isError = err;
    },
    setChainInCollectionDetails(state, collectionDetails) {
      state.collectionDetails['chain'] =  collectionDetails['chain'];
    }
  },
  actions: {
    async connectToWallet({ commit }) {
      console.log("here !");
      const provider = await web3Modal.connect();
      const web3 = new Web3(provider);
      commit("setWeb3", web3);
      commit("setProvider", provider);

      //  Get Accounts
      const accounts = await web3.eth.getAccounts();
      commit("setAccounts", accounts);
      if (accounts.length > 0) {
        commit("setAccount", accounts[0]);
      }

      const networkId = await web3.eth.net.getId();
      console.log(networkId);
      // if (networkId != 4) {
      //   alert("Switch to Rinkeby network");
      //   console.log("not connected to Rinkeby Network");
      // }
      commit("setNetworkId", networkId);

      commit("setActive", true);

      provider.on("connect", async (info) => {
        let chainId = parseInt(info.chainId);
        commit("setChainId", chainId);
        console.log("connect", info);
      });

      provider.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          commit("setAccount", accounts[0]);
        } else {
          await dispatch("resetApp");
        }
        console.log("accountsChanged");
      });

      provider.on("chainChanged", async (chainId) => {
        chainId = parseInt(chainId);
        commit("setChainId", chainId);
        console.log("chainChanged", chainId);
      });
    },

    async loadCollections({ commit, state }) {
      axios.get("http://localhost:3000/getCollections").then(function(response) {
        console.log(response.data);
        commit("setCollectionList", response.data);
      });
    },

    async loadNFTs({ commit, state }, {address, collection_id}) {
      axios.get("http://localhost:3000/getNFTs?collection_id="+collection_id).then(function(response) {
        console.log(response.data);
        commit("setNFTList", response.data);
      });
    },

    async getFundContract({ commit, state }, fundAddress) {
      try {
        var fundChecksumAddress = Web3.utils.toChecksumAddress(fundAddress);
        var fundContract = new state.web3.eth.Contract(collectionABI, fundChecksumAddress);
        return fundContract;
      } catch (error) {
        console.log(error);
        console.log("connected contract not found");
        return null;
      }
    },

    async buyFundTokens({ commit }, { maticAmount, contractId }) {
      try {
        var fundContract = await this.dispatch("getFundContract", contractId);
        var weiAmount = Web3.utils.toWei(maticAmount, 'ether');
        await fundContract.methods.buyTokens().send({
          value: weiAmount,
          from: this.state.account,
        });
        this.dispatch("refreshBalance", contractId);
        commit("setIsError", 0);
        //return false;
      } catch (error) {
        console.log(error);
        commit("setIsError", 1);
      }
    },

    async sellFundTokens({ commit }, { tokenAmount, contractId }) {
      try {
        var fundContract = await this.dispatch("getFundContract", contractId);
        console.log(tokenAmount);
        tokenAmount = Web3.utils.toWei(tokenAmount, 'ether');
        // todo: multiple tokenAmount by 10^18 before sending
        await fundContract.methods.sellTokens(tokenAmount).send({
          from: this.state.account,
        });
        console.log(contractId);
        this.dispatch("refreshBalance", contractId);
        commit("setIsError", 0);
      } catch (error) {
        console.log(error);
        commit("setIsError", 1);
      }
    },

    async pauseBuyAndSell({ commit }, { contractId }) {
      var fundContract = await this.dispatch("getFundContract", contractId);

      await fundContract.methods.toggleTokenConversion().send({
        from: this.state.account,
      });
      this.dispatch("refreshBalance", contractId);
    },

    async toggleBuy({ commit }, { contractId }) {
      try {
        var fundContract = await this.dispatch("getFundContract", contractId);

        await fundContract.methods.toggleBuying().send({
          from: this.state.account,
        });
        this.dispatch("refreshBalance", contractId);
        commit("setIsError", 0);
      } catch (error) {
        console.log(error);
        commit("setIsError", 1);
      }
    },

    async toggleSell({ commit }, { contractId }) {
      try {
        var fundContract = await this.dispatch("getFundContract", contractId);

        await fundContract.methods.toggleSelling().send({
          from: this.state.account,
        });
        this.dispatch("refreshBalance", contractId);
        commit("setIsError", 0);
      } catch (error) {
        console.log(error);
        commit("setIsError", 1);
      }
    },

    async transferFunds({ commit }, { contractId, toAddress, value }) {
      try {
        var fundContract = await this.dispatch("getFundContract", contractId);
        var to = Web3.utils.toChecksumAddress(toAddress);
        var ethAmount = Web3.utils.toWei(value, 'ether');
        await fundContract.methods.transferFunds(to, ethAmount).send({
          from: this.state.account,
        });
        commit("setIsError", 0);
      } catch (error) {
        console.log(error);
        commit("setIsError", 1);
      }
    },

    async refreshBalance({}, fundAddress) {
      await this.dispatch("getMaticBalance");
      await this.dispatch("getCollectionDetails", { collectionContractId: fundAddress });
    },

    async getMaticBalance({ commit, state }) {
      var maticBalance = await state.web3.eth.getBalance(state.account);
      commit("setMaticBalance", Number(Web3.utils.fromWei(maticBalance, "ether")).toFixed(3));
    },

    async getCollectionDetails({ commit, state }, { collectionContractId, collection_id }) {
      var collectionDetails = {};
      console.log(collection_id)

      
      
      var fundContract = await this.dispatch("getFundContract", collectionContractId);
      collectionDetails.ownerAddress = await fundContract.methods.ownerAddress().call();
      var tokenBuyPrice = await fundContract.methods._tokenBuyPrice().call();
      collectionDetails.tokenBuyPrice = Number(Web3.utils.fromWei(tokenBuyPrice, "ether")).toFixed(3);
      var tokenSellPrice = await fundContract.methods._tokenSellPrice().call();
      collectionDetails.tokenSellPrice = Number(Web3.utils.fromWei(tokenSellPrice, "ether")).toFixed(3);
      collectionDetails.name = await fundContract.methods.name().call();
      collectionDetails.symbol = await fundContract.methods.symbol().call();
      collectionDetails.totalSupply = Number(Web3.utils.fromWei(await fundContract.methods.totalSupply().call())).toFixed(3);
      var userTokenBalance = await fundContract.methods.balanceOf(state.account).call();
      collectionDetails.userTokenBalance = Number(Web3.utils.fromWei(userTokenBalance, "ether")).toFixed(3);
      var contractBalance = await state.web3.eth.getBalance(collectionContractId);
      collectionDetails.contractBalance = Number(Web3.utils.fromWei(contractBalance, "ether")).toFixed(3);
      // collectionDetails.buyingEnabled=true;
      // collectionDetails.sellingEnabled=true;
      collectionDetails.buyingEnabled = await fundContract.methods.buyingEnabled().call();
      collectionDetails.sellingEnabled = await fundContract.methods.sellingEnabled().call();

      
      axios.get("http://localhost:3000/getCollectionDetails?collection_id="+collection_id).then(function(response) {
        
        commit("setChainInCollectionDetails", response.data);

      });

      commit("setCollectionDetails", collectionDetails);
    },

    async setTokenPrice({ commit }, { tokenPrice, isBuyBeingModified, contractId }) {
      try {
        var fundContract = await this.dispatch("getFundContract", contractId);
        tokenAmount = Web3.utils.toWei(tokenPrice, 'ether');
        var res = await fundContract.methods.setTokenPrice(tokenAmount, isBuyBeingModified).send({
          from: this.state.account,
        });
        
        await this.dispatch("refreshBalance", contractId);
        commit("setIsError", 0);
      } catch (error) {
        console.log(error);
        commit("setIsError", 1);
      }
    },

    async createFund({ commit, state }, { fundName, fundSymbl, tokenPrice, depositAmt, imgUrl }) {
      var depositAmtInWei = Web3.utils.toWei(depositAmt, 'ether');
      var fundFactoryContract = await this.dispatch("getFundFactoryContract");
      var res = await fundFactoryContract.methods.createFund(fundName, fundSymbl, tokenPrice, imgUrl).send({
        from: this.state.account,
        value: depositAmtInWei,
      });

      await this.dispatch("loadFundData");
    },

    async getNFTsInAddress({ commit, state }, { address }) {
      console.log(address);
      const options = { chain: "rinkeby", address: address };
      const nftsInAddress = await Moralis.Web3API.account.getNFTs(options);
      console.log(nftsInAddress);
      commit("setNftListInAddress", { nftList: nftsInAddress["result"], fundAddress: address });
      return nftsInAddress;
    },
  },
});
