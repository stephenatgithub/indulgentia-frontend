import Image from 'next/image'
import abi from '../utils/Indulgentia.json';
import { ethers } from "ethers";
import Head from 'next/head'
import React, { useEffect, useState } from "react";
import styles from '../styles/Home.module.css'

export default function Home() {
  // Contract Address & ABI
  const contractAddress = "0x630eb2Df48c64efcb4f5630109855221F4BE6611";
  const contractABI = abi.abi;

  // Component state
  const [currentAccount, setCurrentAccount] = useState("");
  //const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);

  /* const onNameChange = (event) => {
    setName(event.target.value);
  } */

  const onMessageChange = (event) => {
    setMessage(event.target.value);
  }

  // Wallet connection logic
  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({method: 'eth_accounts'})
      console.log("accounts: ", accounts);

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("wallet is connected! " + account);
      } else {
        console.log("make sure MetaMask is connected");
      }
    } catch (error) {
      console.log("error: ", error);
    }
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window;

      if (!ethereum) {
        console.log("please install MetaMask");
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  const sendMessage = async () => {
    try {
      const {ethereum} = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        const indulgentia = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("sending message..")
        const tran = await indulgentia.sendMessage(          
          message ? message : "empty message!",
          {value: ethers.utils.parseEther("0")}
        );

        await tran.wait();

        console.log("mined ", tran.hash);

        console.log("message sent!");

        // Clear the form fields.
        //setName("");
        setMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const indulgentia = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        
        console.log("fetching memos from the blockchain..");
        const memos = await indulgentia.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("Metamask is not connected");
      }
      
    } catch (error) {
      console.log(error);
    }
  };
  
  useEffect(() => {
    let indulgentia;
    isWalletConnected();
    getMemos();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from, timestamp, message) => {
      console.log("Memo received: ", from, timestamp, message);
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message
        }
      ]);
    };

    const {ethereum} = window;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      indulgentia = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      indulgentia.on("NewMemo", onNewMemo);
    }

    return () => {
      if (indulgentia) {
        indulgentia.off("NewMemo", onNewMemo);
      }
    }
  }, []);
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Indulgentia</title>
        <meta name="description" content="Indulgentia" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
        <Image
          src="/3.png"
          alt="Indulgentia"
          width={1200}
          height={400}
        />
        </h1>
        
        {currentAccount ? (
          <div>
            <form>
              {/* <div class="formgroup">
                <label>
                  Name
                </label>
                <br/>
                
                <input
                  id="name"
                  type="text"
                  placeholder="anon"
                  onChange={onNameChange}
                  />
              </div>
              <br/> */}
              <div class="formgroup">
                {/* <label>
                Indulgentia
                </label>
                <br/> */}

                <textarea
                  rows={3}
                  placeholder="Guilt to be forgiven"
                  id="message"
                  onChange={onMessageChange}
                  required
                >
                </textarea>
              </div>
              <div>
                <button
                  type="button"
                  onClick={sendMessage}
                >
                  Redemption
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
          <button onClick={connectWallet}> Connect your wallet on the Sepolia testnet </button>
          <br/>
          <br/>
          <br/>
          <a
            href="https://sepoliafaucet.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sepolia FAUCET
          </a>
          </div>
        )}
      </main>

      {currentAccount && (<h1>Guilt has already been forgiven</h1>)}

      {currentAccount && (memos.map((memo, idx) => {
        var date = new Date(memo.timestamp * 1000);
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDay();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        var formattedTime = year + "-" + month + "-" + day + " " + hours + ':' + minutes + ':' + seconds;

        return (
          <div key={idx} style={{border:"2px solid", "border-radius":"5px", padding: "5px", margin: "5px"}}>
            <p style={{"font-weight":"bold"}}>"{memo.message}"</p>
            <p>Time: {formattedTime.toString()}</p>
          </div>
        )
      }))}

      <footer className={styles.footer}>
        <a
          href="https://en.wikipedia.org/wiki/Indulgence"
          target="_blank"
          rel="noopener noreferrer"
        >
          "a way to reduce the amount of punishment one has to undergo for sins"
        </a>
      </footer>
    </div>
  )
}
