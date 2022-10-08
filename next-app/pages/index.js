import Head from 'next/head'
import styles from '../styles/Home.module.css'
import React, { useState, useEffect, useRef } from 'react'
import Web3Modal from 'web3modal'
import { abi, LOTTERY_GAME_CONTRACT_ADDRESS } from '../constants'
import { FETCH_CREATED_GAMES } from '../queries'
import { subGraphQuery } from '../utils'

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false)


  const renderButton = () => {
    return(
      <div></div>
    )
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
        </div>
        <div>
          <img className={styles.image} src="./randomWinnerGame.png" />
        </div>
      </div>
      <footer className={styles.footer}>Made with &#10084; by hafikraimy</footer>
    </div>
  )
}
