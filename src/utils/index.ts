import { BigNumber } from "ethers";

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

export const getFormattedGameTimer = (endingAt: BigNumber) => {
    const { days, hours, minutes, seconds } = getTimeUntil(endingAt);
    const daysString = days > 0 ? `${days}d ` : "";
    const hoursString = hours > 0 ? `${hours}h ` : "";
    const minutesString = minutes > 0 ? `${minutes}m ` : "";
    const secondsString = seconds > 0 ? `${seconds}s ` : "";
    return `${daysString}${hoursString}${minutesString}${secondsString}` ? `${daysString}${hoursString}${minutesString}${secondsString}` : "The game has ended.";
}