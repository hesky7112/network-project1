"""
The Messenger (Nexus)
This system allows the 'Brain' (Data), 'Eyes' (PDF), and 'Hands' (Flow) to talk to each other.
It receives messages from one tool and instantly delivers them to the others.
"""

import logging
from typing import Callable, Dict, List, Any

# Setup a log so we can see what messages are being sent
logger = logging.getLogger("Nexus")
logging.basicConfig(level=logging.INFO)

class Nexus:
    """
    The central communication hub.
    """
    _subscribers: Dict[str, List[Callable]] = {}

    @classmethod
    def broadcast(cls, channel: str, message: Any):
        """
        Send a message to everyone listening on a specific channel.
        Example: The Brain says "I found a problem" on the 'alerts' channel.
        """
        logger.info(f"Nexus Broadcast on [{channel}]: {message}")
        
        if channel in cls._subscribers:
            for callback in cls._subscribers[channel]:
                try:
                    callback(message)
                except Exception as e:
                    logger.error(f"Error delivering message: {e}")

    @classmethod
    def listen(cls, channel: str, callback: Callable):
        """
        Start listening to a channel.
        Example: The Automation Engine starts listening to the 'alerts' channel.
        """
        if channel not in cls._subscribers:
            cls._subscribers[channel] = []
        cls._subscribers[channel].append(callback)
        logger.info(f"New listener added to [{channel}]")

# Global instance for easy access
nexus = Nexus()
