const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function() {
      let fundMe
      let mockV3Aggregator
      let deployer
      //   const sendValue = "1000000000000000000"
      //^ABOVE LINE CAN BE WRITTEN AS BELOW LINE:
      const sendValue = ethers.utils.parseEther("1")

      beforeEach(async function() {
        //deploy our fundme contract using hardhat deploy
        // const { deployer } = await getNamedAccounts()
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        )
      })

      describe("constructor", async function() {
        it("sets the aggregator addresses correctly", async function() {
          const response = await fundMe.s_priceFeed()
          assert.equal(response, mockV3Aggregator.address)
        })
      })

      describe("fund", async function() {
        it("Fails if you don't send enough ETH", async function() {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          )
        })

        it("updated the amount funded data structure", async () => {
          const { deployer } = await getNamedAccounts()
          await fundMe.fund({ value: sendValue })
          const response = await fundMe.s_addressToAmountFunded(deployer)
          assert.equal(response.toString(), sendValue.toString())
        })

        it("Adds funder to array of s_funders", async function() {
          const { deployer } = await getNamedAccounts()
          await fundMe.fund({ value: sendValue })
          const funder = await fundMe.s_funders(0)
          assert.equal(funder, deployer)
        })
      })

      describe("withdraw", async function() {
        beforeEach(async function() {
          await fundMe.fund({ value: sendValue })
        })

        it("Withdraw ETH from a single founder", async function() {
          //Arrange

          deployer = (await getNamedAccounts()).deployer

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )

          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Act

          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )

          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          //Assert

          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
        })

        it("Withdraw ETH from a single founder", async function() {
          //Arrange

          deployer = (await getNamedAccounts()).deployer

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )

          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Act

          const transactionResponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )

          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          //Assert

          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
        })

        it("allows us to withdraw with multiple s_funders", async function() {
          //Arrange
          const accounts = await ethers.getSigners()
          for (i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )

          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Act

          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )

          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Assert

          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )

          //Make sure that the s_funders are reset properly
          await expect(fundMe.s_funders(0)).to.be.reverted

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.s_addressToAmountFunded(accounts[i].address),
              0
            )
          }
        })

        it("cheaperWithdraw testing...", async function() {
          //Arrange
          const accounts = await ethers.getSigners()
          for (i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )

          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Act

          const transactionResponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )

          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Assert

          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )

          //Make sure that the s_funders are reset properly
          await expect(fundMe.s_funders(0)).to.be.reverted

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.s_addressToAmountFunded(accounts[i].address),
              0
            )
          }
        })

        it("Only allows the owner to withdraw", async function() {
          const accounts = await ethers.getSigners()
          const attacker = accounts[1]
          const attackerConnectedContract = await fundMe.connect(attacker)
          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
        })
      })
    })
