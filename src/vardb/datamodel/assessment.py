"""vardb datamodel Assessment class"""

import datetime
from collections import defaultdict

from sqlalchemy import Column, Sequence, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.schema import Index, ForeignKeyConstraint

from vardb.datamodel import Base
from vardb.datamodel import gene, annotation, user


class AlleleAssessment(Base):
    """Represents an assessment of one allele."""
    __tablename__ = "alleleassessment"

    id = Column(Integer, Sequence("id_alleleassessment_seq"), primary_key=True)
    classification = Column(String(5), nullable=False)
    comment = Column(String(), nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"))
    user = relationship("User", uselist=False)
    status = Column(Integer, nullable=False, default=0)  # Intended usage: 0 = non-curated 1 = curated
    dateLastUpdate = Column("date_last_update", DateTime, nullable=False)
    dateSuperceeded = Column("date_superceeded", DateTime)
    previousAssessment_id = Column(Integer, ForeignKey("alleleassessment.id"))
    previousAssessment = relationship("AlleleAssessment", uselist=False)
    allele_id = Column(Integer, ForeignKey("allele.id"), nullable=False)
    allele = relationship("Allele", uselist=False, backref='assessments')
    genepanelName = Column(String, nullable=False)
    genepanelVersion = Column(String, nullable=False)
    genepanel = relationship("Genepanel", uselist=False)
    interpretation_id = Column(Integer, ForeignKey("interpretation.id"))
    transcript_id = Column(Integer, ForeignKey("transcript.id"))
    transcript = relationship("Transcript")
    annotation_id = Column(Integer, ForeignKey("annotation.id"))
    annotation = relationship("Annotation")

    __table_args__ = (ForeignKeyConstraint([genepanelName, genepanelVersion], ["genepanel.name", "genepanel.version"]),)

    def __repr__(self):
        return "<Assessment('%s','%s', '%s')>" % (self.classification, str(self.user), self.status)

    def __str__(self):
        return "%s, %s, %s" % (self.classification, self.status, self.dateLastUpdate)


class ReferenceAssessment(Base):
    """Association object between assessments and references.

    Note that Assessment uses an association proxy;
    usage of AssessmentReference can therefore be sidestepped
    if it is not necessary to change values to the extra attributes in this class.
    """
    __tablename__ = "referenceassessment"

    id = Column(Integer, Sequence("id_referenceassessment_seq"), primary_key=True)
    reference_id = Column(Integer, ForeignKey("reference.id"), nullable=False)
    evaluation = Column(MutableDict.as_mutable(JSONB))
    user_id = Column(Integer, ForeignKey("user.id"))
    user = relationship("User", uselist=False)
    genepanelName = Column(String, nullable=False)
    genepanelVersion = Column(String, nullable=False)
    genepanel = relationship("Genepanel", uselist=False)
    allele_id = Column(Integer, ForeignKey("allele.id"), nullable=False)
    allele = relationship("Allele", uselist=False)
    interpretation_id = Column(Integer, ForeignKey("interpretation.id"))
    interpretation = relationship("Interpretation", backref='referenceassessments')
    dateLastUpdate = Column("date_last_update", DateTime, nullable=False)

    reference = relationship("Reference")

    __table_args__ = (ForeignKeyConstraint([genepanelName, genepanelVersion], ["genepanel.name", "genepanel.version"]),)

    def __str__(self):
        return "%s, %s, %s" % (str(self.user), self.reference, self.evaluation)


class Reference(Base):
    """Represents a reference that brings information to this assessment."""
    __tablename__ = "reference"

    id = Column(Integer, Sequence("id_reference_seq"), primary_key=True)
    authors = Column(String(150))
    title = Column(String(400))
    journal = Column(String(200))
    year = Column(Integer)
    URL = Column(String(200))
    pubmedID = Column(Integer, unique=True)

    __table_args__ = (Index("ix_pubmedid", "pubmedID", unique=True), )

    def __repr__(self):
        return "<Reference('%s','%s', '%s')>" % (self.authors, self.title, self.year)

    def __str__(self):
        return "%s (%s) %s" % (self.authors, self.year, self.journal)

    def citation(self):
        return "%s (%s) %s %s" % (self.authors, self.year, self.title, self.journal)
