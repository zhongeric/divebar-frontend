import { BigNumber, ethers } from "ethers";

export interface supportedNetworksChainId {
    [key: string]: 'KOVAN' | 'HARMONY_TESTNET'
}

export const SUPPORTED_NETWORKS_CHAIN_ID: supportedNetworksChainId = {
    "42": 'KOVAN',
    "1666700000": 'HARMONY_TESTNET'
}

export const NETWORK_CONTRACT_ADDRESSES = {
    KOVAN: "0x6772f46C4d2005Bd52D0b439408DAd9409d4C84C",
    HARMONY_TESTNET: "0xc518433cf505196E6c57687a1cE5b0DfaE1bEe0c"
}

export const NETWORK_NATIVE_TOKEN_SYMBOLS = {
    KOVAN: "ETH",
    HARMONY_TESTNET: "ONE"
}

export const formatBN = (bn: BigNumber, _percision = 3) => {
    const bnAvg = ethers.BigNumber.from(bn);
    return Number(ethers.utils.formatEther(bnAvg)).toFixed(_percision);
}

export const formatAccountAddress = (address: string) => {
    return address.slice(0, 6) + "..." + address.slice(-4);
}

export const getTimeUntil = (end: BigNumber) => {
    const now = new Date().getTime();
    const diff = end.toNumber() - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return {
        days,
        hours,
        minutes,
        seconds,
    };
};

export const getFormattedGameTimer = ({ days, hours, minutes, seconds }: {days: string, hours: string, minutes: string, seconds: string}, milliseconds: number) => {
    const daysString = Number(days) > 0 ? `${Number(days)} days ` : "";
    const hoursString = Number(hours) > 0 ? `${Number(hours)} hours ` : "";
    const minutesString = Number(minutes) > 0 ? `${Number(minutes)} minutes ` : "";
    const secondsString = Number(seconds) > 0 ? `${Number(seconds)}.${milliseconds} seconds ` : "";
    return `${daysString}${hoursString}${minutesString}${secondsString}` ? `${daysString}${hoursString}${minutesString}${secondsString}` : "The game has ended.";
}

export const getNativeTokenName = (chainId: string) => {
    return NETWORK_NATIVE_TOKEN_SYMBOLS[SUPPORTED_NETWORKS_CHAIN_ID[chainId]];
}