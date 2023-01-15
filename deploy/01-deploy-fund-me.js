// function deployFunc() {
//   console.log("Hi")
// }

// module.exports.default = deployFunc

// module.exports = async (hre) => {
//   const { getNamedAccounts, deployments } = hre
// }

//^^^THIS UP SECTION CAN BE WRITTEN DIRECTLY AS SECTION DOWN BELOW

const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/verify")
require("dotenv").config()

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
  let ethUsdPriceFeedAddress
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator")
    ethUsdPriceFeedAddress = ethUsdAggregator.address
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
  }

  //when going for localhost or hardhat network we want to use a mock
  const args = [ethUsdPriceFeedAddress]
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, //put pricefeed address
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1
  })

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args)
  }

  log("--------------------------------")
}

module.exports.tags = ["all", "fundme"]
