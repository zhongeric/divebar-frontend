import React from 'react';
import { useHistory } from 'react-router-dom';
import { BigNumber, ethers } from "ethers";
import abi from "../../utils/DiveBar.json";

import styles from './DiveBar.module.css';
import '../shared/Neon.css';
import { formatAccountAddress, getFormattedGameTimer } from '../../utils';
import Countdown from 'react-countdown';

import { 
    supportedNetworksChainId, 
    SUPPORTED_NETWORKS_CHAIN_ID, 
    NETWORK_CONTRACT_ADDRESSES, 
    NETWORK_NATIVE_TOKEN_SYMBOLS,
    getNativeTokenName
} from '../../utils';

declare let window: any;

type GameType = {
    id: BigNumber,
    playersSize: BigNumber,
    pot: BigNumber,
    avg: BigNumber,
    timeLimit: BigNumber,
    minDeposit: BigNumber,
    createdAt: BigNumber,
    endingAt: BigNumber,
}

export const DiveBar = () => {
    // Add react router useRouter hook
    const history = useHistory();
    const [currentNetworkChainId, setCurrentNetworkChainId] = React.useState<string>("");
    const [contractAddress, setContractAddress] = React.useState<string>("");
    const [currentAccount, setCurrentAccount] = React.useState("");
    const [diveBarContract, setDiveBarContract] = React.useState<ethers.Contract | null>(null);
    const [currentGame, setCurrentGame] = React.useState<GameType | null>(null);
    const [playerBet, setPlayerBet] = React.useState<string>('');
    const [playerHasBet, setPlayerHasBet] = React.useState<boolean>(false);
    const [timeLeft, setTimeLeft] = React.useState<string>("");
    const [playerData, setPlayerData] = React.useState<{bet: BigNumber, timestamp: BigNumber} | null>(null);
    const [userBalance, setUserBalance] = React.useState<BigNumber | null>(null);
    // const contractAddress = '0xa832A99A39CF03454044aC2b2Ce4ACd4dFBECEE8';
    const contractABI = abi.abi;

    const isNetworkSupported = () => {
        return currentNetworkChainId in SUPPORTED_NETWORKS_CHAIN_ID;
    }

    const checkIfWalletIsConnected = async () => {
        try {
            console.log("Checking if wallet is connected...");
          const { ethereum } = window;
          if(!ethereum) {
            console.log("metamask wallet not connected!")
            return;
          }

          const accounts = ethereum.request({ method: 'eth_accounts'});
    
          if(accounts.length) {
            const account = accounts[0];
            console.log("Found an authorized account ", account);
            setCurrentAccount(account);
          }
          else {
            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
            if(!accounts.length) {
                console.log("No authorized account found")
                return;
            }
            const account = accounts[0];
            setCurrentAccount(account);
          }
          const provider = getProvider();
          if(!provider) {
                console.log("No provider found")
                return;
          }
          const { chainId } = await provider.getNetwork()
          setCurrentNetworkChainId(chainId.toString());
        }
        catch (err) {
          console.log(err);
        }
      }

      const getProvider = () => {
            const { ethereum } = window;
            if(!ethereum) {
                console.log("metamask wallet not connected!")
                return;
            }
            const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            provider.on("network", (newNetwork, oldNetwork) => {
                // When a Provider makes its initial connection, it emits a "network"
                // event with a null oldNetwork along with the newNetwork. So, if the
                // oldNetwork exists, it represents a changing network
                setCurrentNetworkChainId(newNetwork.chainId);
                if(!(newNetwork.chainId in SUPPORTED_NETWORKS_CHAIN_ID)) {
                    console.log("Network not supported: " + newNetwork.chainId);
                    return;
                }
                if (oldNetwork) {
                    window.location.reload();
                }
            });
            return provider;
      }

      const getContract = () => {
        const { ethereum } = window;
        if(!ethereum) {
            console.log("metamask wallet not connected!")
            return;
        }
        const provider = getProvider();
        if(!provider) {
            console.log("Failed to get provider")
            return;
        }
        const contract = new ethers.Contract(contractAddress, contractABI, provider.getSigner());
        setDiveBarContract(contract);
        console.log("Got contract")
      }

      React.useEffect(() => {
        checkIfWalletIsConnected();
      }, [])

      React.useEffect(() => {
          if(currentNetworkChainId in SUPPORTED_NETWORKS_CHAIN_ID) {
            setContractAddress(NETWORK_CONTRACT_ADDRESSES[SUPPORTED_NETWORKS_CHAIN_ID[currentNetworkChainId]]);
          }
      }, [currentNetworkChainId])

      React.useEffect(() => {
        getContract();
      }, [contractAddress])

      React.useEffect(() => {
        if(!isNetworkSupported() || !diveBarContract) {
            console.log("Network not supported or contract not found")
            return;
        }
        getGameInfo();
        getUserBalance();
      }, [diveBarContract, currentNetworkChainId])

      // call getGameInfo every second
        React.useEffect(() => {
            // TODO: instead, we should subscribe to Deposit events emitted from contract
            if(!isNetworkSupported() || !diveBarContract) {
                return;
            }
            const interval = setInterval(() => {
                getGameInfo();
            }, 2000);
            return () => clearInterval(interval);
        }, [diveBarContract, currentNetworkChainId])
    
      /**
      * Implement your connectWallet method here
      */
      const connectWallet = async () => {
        try {
            const { ethereum } = window;
        
            if (!ethereum) {
                alert("Get MetaMask!");
                return;
            }
    
            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        
            console.log("Connected", accounts[0]);
            setCurrentAccount(accounts[0]); 
        } catch (error) {
          console.log(error)
        }
    }

    const getGameInfo = async () => {
        try {
          const { ethereum } = window;
          if(!ethereum) throw Error("No ethereum object");
          if(diveBarContract === null) {
                console.log("Failed to get diveBarContract");
                return;
          }
    
            let gameInfo = await diveBarContract.getGameInfo();
            console.log("Got gameInfo for game #", gameInfo.id.toString());
            setCurrentGame({
                id: gameInfo['id'],
                playersSize: gameInfo['playersSize'],
                pot: gameInfo['pot'],
                avg: gameInfo['avg'],
                timeLimit: gameInfo['timeLimit'],
                minDeposit: gameInfo['minDeposit'],
                createdAt: gameInfo['createdAt'],
                endingAt: gameInfo['endingAt'],
            });
        } catch (error) {
          console.log(error);
        //   throw error;
        }
    }

    const getPlayerBetInfo = async () => {
        try {
          const { ethereum } = window;
          if(!ethereum) throw Error("No ethereum object");
          if(diveBarContract === null) {
                console.log("Failed to get diveBarContract");
                return;
          }
          if(!currentAccount) {
                console.log("currentAccount is null");
                return;
            }
    
            let playerBetInfo = await diveBarContract.getPlayer(currentAccount);
            console.log("Got playerBetInfo: ", playerBetInfo);
            setPlayerData({
                bet: playerBetInfo['bet'],
                timestamp: playerBetInfo['timestamp'],
            })
        } catch (error) {
            console.log("Player is not in the game");
            console.log(error);
        }
    }

    const getUserBalance = async () => {
        try {
            const { ethereum } = window;
            if(!ethereum) throw Error("No ethereum object");
            if(diveBarContract === null) {
                console.log("Failed to get diveBarContract");
                return;
            }
            if(!currentAccount) {
                console.log("currentAccount is null");
                return;
            }
            
            let userBalance = await diveBarContract.getUserBalance(currentAccount);
            console.log("Got userBalance: ", userBalance);
            setUserBalance(userBalance);
        } catch (error) {
            console.log(error);
        }
    }

    const placeBet = async () => {
        if(Number(playerBet) === 0) {
            alert("Please enter a bet amount!");
            return;
        }

        const parsedAmt = ethers.utils.parseEther(playerBet);

        if(diveBarContract === null) {
            console.log("Failed to get diveBarContract");
            return;
        }

        if(!currentGame) {
            console.log("Failed to get currentGame");
            return;
        }

        if(parsedAmt < currentGame.minDeposit) {
            alert("Bet amount must be greater than or equal to the minimum deposit");
            return;
        }
        // txn will be reverted if game is over

        try {
            const provider = getProvider();
            if(!provider) {
                console.log("Failed to get provider")
                return;
            }
            const gasPrice = await provider.getGasPrice();
            const signer = await provider.getSigner();
            const tx = await signer.sendTransaction({
                // from: currentAccount,
                to: contractAddress,
                value: parsedAmt.add(gasPrice)
            });
            await tx.wait();
            console.log("Transaction complete!");
            
            await getPlayerBetInfo();
            setPlayerHasBet(true);
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }

    const withdraw = async () => {
        if(diveBarContract === null) {
            console.log("Failed to get diveBarContract");
            return;
        }
        // txn will be reverted if nothing to withdraw
        const txn = await diveBarContract.getPayout();
        console.log("Withdraw txn: ", txn);
        // call getUserBalance() to update userBalance
        await getUserBalance();
    }

    return (
        <div className={`${styles.LandingContainer}`}>
            <div className={styles.NavBar}>
                {!currentAccount ? (
                    <button className={`${styles.ConnectAccountBtn}`} onClick={connectWallet}>
                        Connect Wallet
                    </button>
                )
                    :
                    <div className={styles.WalletConnected}>
                            <img style={{
                                maxWidth: '25px',
                                marginRight: '0.5rem'
                            }} src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg"></img>
                            <div className={styles.WalletConnectedTextBox}>
                                <span style={{ color: 'black', marginBottom: '0.5rem' }}>{formatAccountAddress(currentAccount)}</span>
                                <span style={{ color: 'black' }}>{SUPPORTED_NETWORKS_CHAIN_ID[currentNetworkChainId]}</span>
                            </div>
                     </div>
                }
                {/* <h1 className={styles.HeadingPrimary}>Divebar</h1> */}
                <div className={styles.LogoGameBox}>
                    <div className="logo"><b>d<span>i</span>ve<span>b</span>ar</b></div>
                    <span className={styles.GameNumberText}>Game #{currentGame && currentGame.id.toString()}</span>
                    {/* <span className={styles.GameNumberText}>Started at {currentGame && new Date(currentGame.createdAt.toNumber()).toLocaleTimeString()}</span> */}
                </div>
                <div className={styles.BalanceBox}>
                    {userBalance && <span style={{
                        color: 'black',
                        fontWeight: 600
                    }}>Balance: {Number(ethers.utils.formatEther(userBalance)).toFixed(3)} {getNativeTokenName(currentNetworkChainId)}</span>}
                    <button className={`${styles.ConnectAccountBtn}`} onClick={withdraw}>
                        Withdraw
                    </button>
                </div>
            </div>
            {/*
                * If there is no currentAccount render this button
            */}

            <div className={styles.DiveBarContainer}>
                {currentGame && <div className={styles.GameContainer}>
                    <div className={styles.GameTimerContainer}>
                        <Countdown
                            date={new Date(currentGame.endingAt.toNumber() * 1000)}
                            intervalDelay={0}
                            precision={3}
                            renderer={props => <span className={styles.GameTimer}>{getFormattedGameTimer(props.formatted, props.milliseconds)}</span>}
                        />
                    </div>
                    <div className={styles.MainGame}>
                        <span className={styles.HeadingPrimary}>The bar is currently at</span>
                        <span className={styles.BarText}>{Number(ethers.utils.formatEther(currentGame.avg)).toFixed(3)} Ξ</span>
                    </div>
                    {/* <div>
                        Bets visualization here
                    </div> */}
                    <div className={styles.PotDisplay}>
                        <span className={styles.PotText} style={{
                            marginRight: '1rem'
                        }}>Pot: {Number(ethers.utils.formatEther(currentGame.pot)).toFixed(3)} {getNativeTokenName(currentNetworkChainId)}</span>
                        <span className={styles.PotText}>Current players: {currentGame.playersSize.toString()}</span>
                    </div>
                    {playerHasBet === false ? <div className={styles.BetContainer}>
                        <input type="number" placeholder='0.001' className={styles.BetInput} value={playerBet} onChange={(e) => setPlayerBet(e.currentTarget.value)} />
                        <span style={{
                            fontSize: "1.25rem",
                            lineHeight: '2',
                            marginLeft: '0.5rem',
                            alignSelf: 'end'
                        }}>{getNativeTokenName(currentNetworkChainId)}</span>
                        <button className={`${styles.BetBtn}`} onClick={placeBet}>
                            <div className="logoRegFont"><b>E<span>nt</span>er</b></div>
                        </button>
                    </div> : 
                    <div className={styles.BetContainer}>
                        <span className={`retro ${styles.BetText}`}>Your bet: {playerData && Number(ethers.utils.formatEther(playerData.bet)).toFixed(3)} {getNativeTokenName(currentNetworkChainId)}</span>
                    </div>}
                </div>}
                <div className={styles.RulesContainer}>
                    <span className={styles.HeadingSecondary}>This establishment's rules:</span>
                    <div className={styles.Rules}>
                        <span>You may only bet once per game. You cannot withdraw your bet once it is placed.</span><br />
                        <span>The minimum bet is {currentGame && ethers.utils.formatEther(currentGame.minDeposit)} {getNativeTokenName(currentNetworkChainId)}.</span><br />
                        <span>Patrons are rewarded for betting earlier than others. For more details on how this is calculated, see Rewards below.</span><br />
                        <span>The esteemed Divebar establishment takes 0.01% of all winnings to keep the lights on.</span><br />
                    </div>
                    <span className={styles.HeadingSecondary}>Rewards</span>
                    <div className={styles.Rules}>
                        <span>You are a winner of the game if your bet is above the simple average of all other bets when the game ends.</span>
                        <br />
                        <span>Winners receive a payout structured as follows:</span>   
                        <br />
                        <span className={styles.Equation}>payout = your original bet + a weighted portion of a pot containing the sum of all losing bets.</span>
                        <br />
                        <span>The weighted portion decreases polynomially as the game timer winds down. Thus, the last player to enter will receive only their original bet back if they win. The entire pot is returned to the winners of each game.</span>
                        <br />
                        <span>This strategy is employed to combat the edge that players who enter later have, since they can view the bets of everyone before them.</span>
                        <br />
                        <span>Your winnings in {getNativeTokenName(currentNetworkChainId)} will be displayed at the top of the page, and you can withdraw them via the Withdraw button at anytime.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}