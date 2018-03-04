import { BigNumber }        from 'bignumber.js'
import { MODULES }          from './constants/modules'
import { ACTIONS }          from './constants/actions'
import { etherConvert }     from './utils/etherConvert'
import { UNITS }            from './constants/units'
import { getHex }           from './utils/getHex'
import { EtherscanRequest } from './EtherscanRequest'

/**
 * Etherscan API
 */
export class EtherscanApi extends EtherscanRequest {
  /**
   * Returns Ether Balance for a single Address
   * @param address
   * @param {string?} [unit="wei"] Balance unit
   * @return {Promise<string>}
   */
  public async getAccountBalance(
    address: string,
    unit: keyof typeof UNITS = 'wei',
    tag: string = 'latest'
  ): Promise<string> {
    const resp = await this.createRequest({
      module: MODULES.ACCOUNT,
      action: ACTIONS.GET_BALANCE,
      tag,
      address
    })

    // Converting balance to another unit
    return unit === 'wei' || !(unit in UNITS)
      ? resp
      : etherConvert(resp, 'wei', unit)
  }

  /**
   * Get Ether Balance for multiple Addresses in a single call
   * @description Up to a maximum of 20 accounts in a single batch
   * @param {Array<string>} addresses
   * @param {string?} [unit="wei"] Balance unit
   *
   */
  public async getAccountBalances(
    addresses: string[],
    unit: keyof typeof UNITS = 'wei',
    tag: string = 'latest'
  ): Promise<{ account: string; balance: string }[]> {
    const resp: {
      account: string
      balance: string
    }[] = await this.createRequest({
      apikey:  this.token,
      module:  MODULES.ACCOUNT,
      action:  ACTIONS.GET_BALANCE_MULTI,
      address: addresses.join(','),
      tag
    })

    // Converting balances to another unit
    return unit === 'wei' || !(unit in UNITS)
      ? resp
      : resp.map(item => {
        return {
          account: item.account,
          balance: etherConvert(item.balance, 'wei', unit)
        }
      })
  }

  /**
   * Get a list of 'Normal' Transactions By Address
   * Returns up to a maximum of the last 10000 transactions only
   * @param address Contract address
   * @param startBlock Starting block number to retrieve results
   * @param endBlock Ending block number to retrieve results
   * @param offset Max records to return
   * @param page Page number
   * @param sort Sort type (asc/desc)
   * @return {Promise<TransactionDescription[]>}
   */
  public async getTransactions(
    address: string,
    startBlock?: number,
    endBlock?: number,
    offset?: number,
    page?: number,
    sort?: 'asc' | 'desc'
  ): Promise<TransactionDescription[]> {
    return this.createRequest({
      module:     MODULES.ACCOUNT,
      action:     ACTIONS.GET_TRANSACTIONS_LIST,
      address,
      endblock:   endBlock,
      startblock: startBlock,
      offset,
      page,
      sort
    })
  }

  /**
   * Returns a list of 'Internal' Transactions by Address
   * Returns up to a maximum of the last 10000 transactions only
   * @param address Contract address
   * @param startBlock Starting block number to retrieve results
   * @param endBlock Ending block number to retrieve results
   * @param offset Max records to return
   * @param page Page number
   * @param sort Sort type (asc/desc)
   * @return {Promise<TransactionDescription[]>}
   */
  public async getInternalTransactions(
    address: string,
    startBlock?: number,
    endBlock?: number,
    offset?: number,
    page?: number,
    sort?: 'asc' | 'desc'
  ): Promise<InternalTransactionDescription[]> {
    return this.createRequest({
      module:     MODULES.ACCOUNT,
      action:     ACTIONS.GET_TRANSACTIONS_LIST_INTERNAL,
      address,
      endblock:   endBlock,
      startblock: startBlock,
      offset,
      page,
      sort
    })
  }

  /**
   * Returns a list of 'Internal' Transactions by Address
   * @param txhash Contract address
   * @return {Promise<InternalTransactionDescription[]>}
   */
  public async getInternalTransactionsByHash(
    txhash: string
  ): Promise<TransactionDescription[]> {
    return this.createRequest({
      module: MODULES.ACCOUNT,
      action: ACTIONS.GET_TRANSACTIONS_LIST_INTERNAL,
      txhash
    })
  }

  /**
   * List of Blocks Mined by Address
   * @param {string} address Miner address
   * @param {'blocks'|'uncles'} type Type of block: blocks (full blocks only)
   * or uncles (uncle blocks only)
   * @param {number} offset Max records to return
   * @param {number} page Page number
   * @return {Promise<BlockInfo[]>}
   */
  public async getMinedBlocks(
    address: string,
    type: 'blocks' | 'uncles' = 'blocks',
    offset?: number,
    page?: number
  ): Promise<BlockInfo[]> {
    return this.createRequest({
      module:    MODULES.ACCOUNT,
      action:    ACTIONS.GET_MINED_BLOCKS,
      blocktype: type,
      address,
      offset,
      page
    })
  }

  /**
   * Returns Contract ABI
   * @param address
   * @return {Promsie<AbiItemDescription[]>}
   */
  public async getContractAbi(address: string): Promise<AbiItemDescription[]> {
    const resp = await this.createRequest({
      module: MODULES.CONTRACT,
      action: ACTIONS.GET_ABI,
      address
    })

    return JSON.parse(resp)
  }

  /**
   * Checks contract execution status (if there was an error during contract
   * execution).
   * @description "isError": "0" = Pass, "isError": "1" = Error during contract
   * execution
   * @param txhash Contract address
   * @return {Promise<object>}
   */
  public async getContractExecutionStatus(
    txhash: string
  ): Promise<{
    isError: string
    errDescription?: string
  }> {
    const resp = await this.createRequest({
      module: MODULES.TRANSACTION,
      action: ACTIONS.GET_CONTRACT_STATUS,
      txhash
    })

    return resp
  }

  /**
   * Checks transaction receipt status (only applicable for post byzantium fork
   * transactions).
   * @description Status: 0 = Fail, 1 = Pass. Will return null/empty value
   * for pre-byzantium fork
   * @param txhash Transaction address
   * @return {Promise<object>}
   */
  public async getTransactionStatus(
    txhash: string
  ): Promise<{ status: string }> {
    return this.createRequest({
      module: MODULES.TRANSACTION,
      action: ACTIONS.GET_TRANSACTION_STATUS,
      txhash
    })
  }

  /**
   * Get block and uncle rewards by block number
   * @param {number} blockNumber The number of the block
   */
  public async getBlockReward(
    blockNumber: number | string
  ): Promise<BlockRewardInfo> {
    return this.createRequest({
      module:  MODULES.BLOCK,
      action:  ACTIONS.GET_BLOCK_REWARD,
      blockno: blockNumber
    })
  }

  /**
   * Returns events logs
   * @description The Event Log API was designed to provide an alternative to
   * the native eth_getLogs. Topic Operator (opr) choices are either 'and' or
   * 'or' and are restricted to the above choices only. For performance and
   * security considerations, only the first 1000 results are return.
   * @param {string} address
   * @param {number} fromBlock Start block number (integer, NOT hex)
   * @param {number|'latest'} toBlock End block number or "latest"
   * (earliest and pending is NOT supported yet)
   * @param {string} topic0 Topic 0
   * @param {'and'|'or'?} topic01operator Operator (and|or) between topic0
   * & topic1
   * @param {string?} topic1 Topic 1
   * @param {'and'|'or'?} topic12operator Operator (and|or) between topic1
   * & topic2
   * @param {string} topic2 Topic 2
   * @param {'and'|'or'?} topic23operator Operator (and|or) between topic2
   * & topic3
   * @param {string?} topic3 Topic 3
   * @param {'and'|'or'?} topic02operator Operator (and|or) between topic0
   * & topic2
   */
  public async getEventsLogs(
    address: string,
    fromBlock: number,
    toBlock: number | 'latest',
    topic0?: string,
    topic01operator?: 'and' | 'or',
    topic1?: string,
    topic12operator?: 'and' | 'or',
    topic2?: string,
    topic23operator?: 'and' | 'or',
    topic3?: string,
    topic02operator?: 'and' | 'or'
  ): Promise<EventDescription[]> {
    return this.createRequest({
      module:       MODULES.LOGS,
      action:       ACTIONS.GET_LOGS,
      fromBlock,
      toBlock,
      topic0,
      topic0_1_opr: topic01operator,
      topic1,
      topic1_2_opr: topic12operator,
      topic2,
      topic2_3_opr: topic23operator,
      topic3,
      topic0_2_opr: topic02operator
    })
  }

  /**
   * Returns the number of the most recent block
   * @return {Promise<number>}
   */
  public async getRecentBlockNumber(): Promise<number> {
    const blockNumberHex: string = await this.createRequest({
      module: MODULES.PROXY,
      action: ACTIONS.GET_RECENT_BLOCK_NUMBER
    })

    return parseInt(blockNumberHex, 16)
  }

  /**
   * Returns information about a block by block number
   * @param {number} blockNumber Block number
   * @return {Promise<GethBlockInfo>}
   */
  public async getBlockByNumber(blockNumber: number): Promise<GethBlockInfo> {
    return this.createRequest({
      module:  MODULES.PROXY,
      action:  ACTIONS.GET_BLOCK_BY_NUMBER,
      tag:     '0x' + blockNumber.toString(16),
      boolean: 'true'
    })
  }

  /**
   * Returns information about a uncle by block number and index
   * @param {number} blockNumber
   * @param {number} [index=0]
   * @return {Promise<GethBlockInfo>}
   */
  public async getUncleByBlockNumberAndIndex(
    blockNumber: number,
    index: number = 0
  ): Promise<GethBlockInfo> {
    return this.createRequest({
      module: MODULES.PROXY,
      action: ACTIONS.GET_UNCLE_BLOCK_NUMBER_AND_INDEX,
      tag:    getHex(blockNumber),
      index:  getHex(index)
    })
  }

  /**
   * Returns the number of transactions in a block from a block matching the
   * given block number
   * @param {number} blockNumber
   * @return {Promise<number>}
   */
  public async getBlockTransactionCount(blockNumber: number): Promise<number> {
    const countHex = await this.createRequest({
      module: MODULES.PROXY,
      action: ACTIONS.GET_BLOCK_TX_COUNT_BY_NUMBER,
      tag:    getHex(blockNumber)
    })

    return parseInt(countHex, 16)
  }

  /**
   * Returns the information about a transaction requested by transaction hash
   * @param {string} txhash Transaction hash
   * @return {Promise<TransactionDescription>}
   */
  public async getTransactionByHash(
    txhash: string
  ): Promise<TransactionDescription> {
    return this.createRequest({
      module: MODULES.PROXY,
      action: ACTIONS.GET_TRANSACTION_BY_HASH,
      txhash
    })
  }

  /**
   * Returns information about a transaction by block number and transaction
   * index position
   * @param {number} blockNumber
   * @param {number} [index=0]
   * @returns {Promise<TransactionDescription>}
   */
  public async getTransactionByBlockNumberAndIndex(
    blockNumber: number,
    index: number = 0
  ): Promise<TransactionDescription> {
    return this.createRequest({
      module: MODULES.PROXY,
      action: ACTIONS.GET_TX_BY_BLOCK_NUMBER_AND_INDEX,
      tag:    getHex(blockNumber),
      index:  getHex(index)
    })
  }

  /**
   * Returns the number of transactions sent from an address
   * @param {string} address Transaction address
   * @returns {Promise<number>}
   */
  public async getTransactionCount(
    address: string,
    tag: string = 'latest'
  ): Promise<number> {
    const countHex = await this.createRequest({
      module: MODULES.PROXY,
      action: ACTIONS.GET_TRANSACTION_COUNT,
      tag,
      address
    })

    return parseInt(countHex, 16)
  }

  /**
   * Creates new message call transaction or a contract creation for signed
   * transactions
   * @param {string} hex Raw hex encoded transaction that you want to send
   */
  public async sendRawTransaction(hex: string): Promise<void> {
    this.createRequest({
      module: MODULES.PROXY,
      action: ACTIONS.SEND_RAW_TRANSACTION,
      hex
    })
  }

  /**
   * Returns the receipt of a transaction by transaction hash
   * @param {string} txhash Transaction hash
   * @returns {Promise<TransactionReceipt>}
   */
  public async getTransactionReceipt(
    txhash: string
  ): Promise<TransactionReceipt> {
    return this.createRequest({
      module: MODULES.PROXY,
      action: ACTIONS.GET_TRANSACTION_RECEIPT,
      txhash
    })
  }

  /**
   * Executes a new message call immediately without creating a transaction on
   * the block chain
   * @param {string} to Address to execute from
   * @param {string} data Data to transfer
   * @return {Promise<string>}
   */
  public async call(
    to: string,
    data: string,
    tag: string = 'latest'
  ): Promise<string> {
    return this.createRequest({
      module: MODULES.PROXY,
      action: ACTIONS.CALL,
      tag,
      to,
      data
    })
  }

  /**
   * Returns code at a given address
   * @param {string} address
   * @returns {Promise<string>}
   */
  public async getCode(
    address: string,
    tag: string = 'latest'
  ): Promise<string> {
    return this.createRequest({
      module: MODULES.PROXY,
      action: ACTIONS.GET_CODE,
      address,
      tag
    })
  }

  /**
   * Returns the value from a storage position at a given address.
   * @param {string} address
   * @param {number} position
   * @return {Promise<string>}
   */
  public async getStorageAt(
    address: string,
    position: number,
    tag: string = 'latest'
  ): Promise<string> {
    return this.createRequest({
      module:   MODULES.PROXY,
      action:   ACTIONS.GET_STORAGE_AT,
      address,
      position: getHex(position),
      tag
    })
  }

  /**
   * Returns the current price per gas (in wei by default)
   * @param {string} [unit="wei"] Unit of gas
   * @return {string}
   */
  public async getGasPrice(unit: keyof typeof UNITS = 'wei') {
    const priceHex = await this.createRequest({
      module: MODULES.PROXY,
      action: ACTIONS.GET_GAS_PRICE
    })

    const priceBN: BigNumber = new BigNumber(priceHex)
    const priceFixed: string = priceBN.toFixed()

    // If unit is wei, don't convert gas price
    if (unit === 'wei') {
      return priceFixed
    }

    // else covert to specified ether unit
    return etherConvert(priceFixed, 'wei', unit)
  }

  /**
   * Makes a call or transaction, which won't be added to the blockchain and
   * returns the used gas, which can be used for estimating the used gas
   * @param {string} to Address to get code from
   * @param {string} value Storage position
   * @param {string} gasPrice Gas price in wei
   * @param {string} gas
   */
  public async estimateGas(
    to: string,
    value: string | number,
    gasPrice: string,
    gas: string
  ): Promise<void> {
    this.createRequest({
      module: MODULES.PROXY,
      action: ACTIONS.ESTIMATE_GAS,
      to,
      value,
      gasPrice,
      gas
    })
  }

  /**
   * Get ERC20-Token TotalSupply by ContractAddress
   * @param {string} contractAddress
   * @return {Promise<string>}
   */
  public async getTokenByContractAddress(
    contractAddress: string
  ): Promise<string> {
    return this.createRequest({
      module:          MODULES.STATS,
      action:          ACTIONS.GET_TOKEN_BY_CONTRACT,
      contractaddress: contractAddress
    })
  }

  /**
   * Get ERC20-Token Account Balance for TokenContractAddress
   * @param {string} contractAddress
   * @return {Promise<string>}
   */
  public async getTokenBalanceByContractAddress(
    contractAddress: string,
    address: string,
    tag: string = 'latest'
  ): Promise<string> {
    return this.createRequest({
      module:          MODULES.ACCOUNT,
      action:          ACTIONS.GET_TOKEN_BALANCE_BY_CONTRACT,
      contractaddress: contractAddress,
      address,
      tag
    })
  }

  /**
   * Get total supply of Ether
   * @return {Promise<string>}
   */
  public async getTotalEtherSupply(): Promise<string> {
    return this.createRequest({
      module: MODULES.STATS,
      action: ACTIONS.GET_TOTAL_ETHER_SUPPLY
    })
  }

  /**
   * Get Ether last price
   * @return {Promise<EtherPrice>}
   */
  public async getEtherLastPrice(): Promise<EtherPrice> {
    return this.createRequest({
      module: MODULES.STATS,
      action: ACTIONS.GET_LAST_ETHER_PRICE
    })
  }
}