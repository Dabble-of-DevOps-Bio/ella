import os
from sqlalchemy.orm import scoped_session
from extended_query import ExtendedQuery


class DB(object):

    def __init__(self):
        self.engine = None
        self.session = None

    def connect(self,
                host=None,
                engine_kwargs=None):

        # Lazy load dependencies to avoid problems in code not actually using DB, but uses modules from which this module is referenced.
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        # Disconnect in case we're already connected
        self.disconnect()
        self.host = host or os.environ.get('DB_URL')

        if not engine_kwargs:
            engine_kwargs = dict()

        self.engine = create_engine(
            self.host,
            client_encoding='utf8',
            **engine_kwargs
        )

        self.sessionmaker = sessionmaker(  # Class for creating session instances
            bind=self.engine,
            query_cls=ExtendedQuery
        )
        self.session = scoped_session(self.sessionmaker)

    def disconnect(self):
        if self.session:
            self.session.close()
        if self.engine:
            self.engine.dispose()
