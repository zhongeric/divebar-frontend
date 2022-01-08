import React from 'react';
import { useHistory } from 'react-router-dom';
import { BigNumber, ethers } from "ethers";
import abi from "../../utils/DiveBar.json";

import styles from './DiveBar.module.css';
import { getFormattedGameTimer } from '../../utils';
import Countdown from 'react-countdown';

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
    const [currentAccount, setCurrentAccount] = React.useState("");
    const [diveBarContract, setDiveBarContract] = React.useState<ethers.Contract | null>(null);
    const [currentGame, setCurrentGame] = React.useState<GameType | null>(null);
    const [playerBet, setPlayerBet] = React.useState<string>('0');
    const [playerHasBet, setPlayerHasBet] = React.useState<boolean>(false);
    const [timeLeft, setTimeLeft] = React.useState<string>("");
    const [playerData, setPlayerData] = React.useState<{bet: BigNumber, timestamp: BigNumber} | null>(null);
    const [userBalance, setUserBalance] = React.useState<BigNumber | null>(null);
    const contractAddress = '0xa832A99A39CF03454044aC2b2Ce4ACd4dFBECEE8';
    const contractABI = abi.abi;

    const checkIfWalletIsConnected = () => {
        try {
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
            console.log("No authorized account found")
          }
        }
        catch (err) {
          console.log(err);
        }
      }

      const getContract = () => {
        const { ethereum } = window;
        if(!ethereum) {
            console.log("metamask wallet not connected!")
            return;
        }
        const provider = new ethers.providers.Web3Provider(ethereum);
        const contract = new ethers.Contract(contractAddress, contractABI, provider.getSigner());
        setDiveBarContract(contract);
        console.log("contract", contract);
      }

      React.useEffect(() => {
        checkIfWalletIsConnected();
      }, [])

      React.useEffect(() => {
        getContract();
      }, [currentAccount])

      React.useEffect(() => {
        getGameInfo();
        getUserBalance();
      }, [diveBarContract])

      // call getGameInfo every second
        React.useEffect(() => {
            // TODO: instead, we should subscribe to Deposit events emitted from contract
            const interval = setInterval(() => {
                getGameInfo();
            }, 1000);
            return () => clearInterval(interval);
        }, [diveBarContract])
    
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
          if(diveBarContract === null) {
                console.log("Failed to get diveBarContract");
                return;
          }
    
          if (ethereum) {
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
            
            // TODO: use if keepers is not supported on current network
            // if(gameInfo['endingAt'].toNumber() < Date.now() / 1000) {
            //     console.log("Game is over, calling handleGameOver()");
            //     // const txn = await diveBarContract.handleGameOver();
            //     // console.log("Game over txn: ", txn);
            // }
          } else {
            console.log("Ethereum object doesn't exist!");
          }
        } catch (error) {
          console.log(error);
          throw error;
        }
    }

    const getPlayerBetInfo = async () => {
        try {
          const { ethereum } = window;
          if(diveBarContract === null) {
                console.log("Failed to get diveBarContract");
                return;
          }
          if(!currentAccount) {
                console.log("currentAccount is null");
                return;
            }
    
          if (ethereum) {
            let playerBetInfo = await diveBarContract.getPlayer(currentAccount);
            console.log("Got playerBetInfo: ", playerBetInfo);
            setPlayerData({
                bet: playerBetInfo['bet'],
                timestamp: playerBetInfo['timestamp'],
            })
          } else {
            console.log("Ethereum object doesn't exist!");
          }
        } catch (error) {
            console.log("Player is not in the game");
            console.log(error);
        }
    }

    const getUserBalance = async () => {
        try {
            const { ethereum } = window;
            if(diveBarContract === null) {
                console.log("Failed to get diveBarContract");
                return;
            }
            if(!currentAccount) {
                console.log("currentAccount is null");
                return;
            }
            
            if (ethereum) {
                let userBalance = await diveBarContract.getUserBalance(currentAccount);
                console.log("Got userBalance: ", userBalance);
                setUserBalance(userBalance);
            } else {
                console.log("Ethereum object doesn't exist!");
            }
        } catch (error) {
            console.log(error);
        }
    }

    const placeBet = async () => {
        if(playerBet === '0') {
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

        if(parsedAmt < currentGame?.minDeposit) {
            alert("Bet amount must be greater than or equal to the minimum deposit");
            return;
        }
        // txn will be reverted if game is over

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
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
                    <button className={`retro ${styles.ConnectAccountBtn}`} onClick={connectWallet}>
                        Connect Wallet
                    </button>
                )
                    :
                    <div>
                        Wallet connected
                    </div>
                }
                <h1 className={styles.HeadingPrimary}>DiveBar</h1>
                <div>
                    {userBalance && <span>Balance: {Number(ethers.utils.formatEther(userBalance)).toFixed(3)} ETH</span>}
                    <button className={`retro ${styles.ConnectAccountBtn}`} onClick={withdraw}>
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
                    <div>
                        Bets visualization here
                    </div>
                    <div className={styles.PotDisplay}>
                        <span className={styles.PotText} style={{
                            marginRight: '1rem'
                        }}>Pot: {Number(ethers.utils.formatEther(currentGame.pot)).toFixed(3)} ETH</span>
                        <span className={styles.PotText}>Current players: {currentGame.playersSize.toString()}</span>
                    </div>
                    {playerHasBet === false ? <div className={styles.BetContainer}>
                        <input type="number" className={styles.BetInput} value={playerBet} onChange={(e) => setPlayerBet(e.currentTarget.value)} />
                        <span style={{
                            fontSize: "1.25rem",
                            lineHeight: '2',
                            marginLeft: '0.5rem',
                            alignSelf: 'end'
                        }}>ETH</span>
                        <button className={`retro ${styles.BetBtn}`} onClick={placeBet}>Bet</button>
                    </div> : 
                    <div className={styles.BetContainer}>
                        <span className={`retro ${styles.BetText}`}>Your bet: {playerData && Number(ethers.utils.formatEther(playerData.bet)).toFixed(3)} ETH</span>
                    </div>}
                </div>}
                <div className={styles.RulesContainer}>
                    <span className={styles.HeadingSecondary}>The establishment's rules:</span>
                    <div className={styles.Rules}>
                        <span>You may only bet once per game. You cannot withdraw your bet once it is placed.</span><br />
                        <span>The minimum bet is {currentGame && ethers.utils.formatEther(currentGame.minDeposit)} ETH.</span><br />
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
                        <span>Your winnings in ETH will be displayed at the top of the page, and you can withdraw them via the Withdraw button at anytime.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}