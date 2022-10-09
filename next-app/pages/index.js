import Head from 'next/head'
import styles from '../styles/Home.module.css'
import React, { useState, useEffect, useRef } from 'react'
import Web3Modal from 'web3modal'
import { abi, LOTTERY_GAME_CONTRACT_ADDRESS } from '../constants'
import { FETCH_CREATED_GAMES } from '../queries'
import { subGraphQuery } from '../utils'
import { BigNumber, Contract, ethers, providers, utils } from 'ethers'

export default function Home() {
  const zero = BigNumber.from("0")
  const [walletConnected, setWalletConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [entryFee, setEntryFee] = useState(zero)
  const [maxPlayers, setMaxPlayers] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [players, setPlayers] = useState([])
  const [winner, setWinner] = useState()
  const [logs, setLogs] = useState([])
  const web3ModalRef = useRef()

  const forceUpdate = React.useReducer(() => ({}), {})[1]


  const startGame = async () => {
    try {
      const signer = await getProviderOrSigner(true)
  
      const lotteryGameContract = new Contract(
        LOTTERY_GAME_CONTRACT_ADDRESS,
        abi,
        signer
      )
      setLoading(true)
      const tx = await lotteryGameContract.startGame(maxPlayers, entryFee)
      await tx.wait()
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const joinGame = async () => {
    try {
      const signer = await getProviderOrSigner(true)

      const lotteryGameContract = new Contract(
        LOTTERY_GAME_CONTRACT_ADDRESS,
        abi,
        signer,
      )

      setLoading(true)
      const tx = await lotteryGameContract.joinGame({
        value: entryFee
      })
      await tx.wait()
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner()
      const lotteryGameContract = new Contract(
        LOTTERY_GAME_CONTRACT_ADDRESS,
        abi, 
        provider
      ) 

      const _owner = await lotteryGameContract.owner()
      const signer = await getProviderOrSigner(true)
      const address = await signer.getAddress()
      
      if(address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const checkIfGameStarted = async () => {
    try {
      const provider = await getProviderOrSigner()
      const lotteryGameContract = new Contract(
        LOTTERY_GAME_CONTRACT_ADDRESS,
        abi,
        provider
      )

      const _gameStarted = await lotteryGameContract.gameStarted()

      const _gameArray = await subGraphQuery(FETCH_CREATED_GAMES())
      const _game = _gameArray.games[0]
      let _logs = []

      if(_gameStarted) {
        _logs = [`Game has started with ID: ${_game.id}`]
        if(_game.players && _game.players.length > 0) {
          _logs.push(
            `${_game.players.length} / ${_game.maxPlayers} already joined`
          )
          _game.players.forEach((player) => {
            _logs.push(`${player} joined`)
          })
        }
        setEntryFee(BigNumber.from(_game.entryFee))
        setMaxPlayers(BigNumber.from(_game.maxPlayers))
      } else if (!_gameStarted && _game.winner) {
        _logs = [
          `Last game has ended with ID: ${_game.id}`,
          `Winner is: ${_game.winner}`,
          `Waiting for host to start a new game...`, 
        ]
        setWinner(_game.winner)
      }
      setLogs(_logs)
      setPlayers(_game.players)
      setGameStarted(_gameStarted)
      forceUpdate()
    } catch (error) {
      console.error(error)
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    try {
      const provider = await web3ModalRef.current.connect()
      const web3Provider = new providers.Web3Provider(provider)

      const { chainId } = await web3Provider.getNetwork()
      if(chainId !== 80001) {
        window.alert("Change the network to Mumbai")
        throw new Error("Change the network to Mumbai")
      }

      if(needSigner) {
        const signer = await web3Provider.getSigner()
        return signer
      }
      return web3Provider
    } catch (error) {
      console.error(error)
    }
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner()
      setWalletConnected(true)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if(!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "mumbai",
        providerOptions: {},
        disableInjectedProvider: false,
      })
      connectWallet()
      getOwner()
      checkIfGameStarted()
      setInterval(() => {
        checkIfGameStarted()
      }, 2000);
    }
  }, [walletConnected])

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    if (gameStarted) {
      if (players.length === maxPlayers) {
        return (
          <button className={styles.button} disabled>
            Choosing winner...
          </button>
        );
      }
      return (
        <div>
          <button className={styles.button} onClick={joinGame}>
            Join Game 🚀
          </button>
        </div>
      );
    }
    
    if(isOwner && !gameStarted) {
      return (
        <div>
          <input 
            type="number"
            className={styles.input}
            onChange={(e) => {
              setEntryFee(
                e.target.value >= 0 
                  ? utils.parseEther(e.target.value.toString())
                  : zero
              )
            }} 
            placeholder="Entry Fee (ETH)"
          />
          <input 
            type="number"
            className={styles.input}
            onChange={(e) => {
              setMaxPlayers(e.target.value ?? 0);
            }} 
            placeholder="Max players"
          />
          <button className={styles.button} onClick={startGame}>
            Start the game
          </button>
        </div>
      )
    }
  }

  return (
    <div>
      <Head>
        <title>Lottery Game</title>
        <meta name="description" content="lottery-game" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Lottery Game</h1>
          <div className={styles.description}>
            Its a lottery game where a winner is chosen at random and wins the entire lottery pool
          </div>
          {renderButton()}
          {logs &&
            logs?.map((log, index) => (
              <div className={styles.log} key={index}>
                {log}
              </div>
            ))}
        </div>
        <div>
          <img className={styles.image} src="./randomWinner.png" />
        </div>
      </div>
      <footer className={styles.footer}>Made with &#10084; by hafikraimy</footer>
    </div>
  )
}
