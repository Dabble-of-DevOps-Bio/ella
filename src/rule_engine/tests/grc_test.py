from .. grc import ACMGClassifier2015,ClassificationResult
from .. grm import GRM
import unittest
import re
from itertools import takewhile

class ACMGClassifier2015Test(unittest.TestCase):

    def test_count_occurences(self):
        classifier = ACMGClassifier2015()
        self.assertListEqual(classifier.occurences(re.compile("PVS1"), ["PVS1"]), ["PVS1"])
        self.assertListEqual(classifier.occurences(re.compile("PVS1"), ["PVS2", "BP1"]), [])
        self.assertListEqual(classifier.occurences(re.compile("PS1"), []), [])
        self.assertListEqual(classifier.occurences(re.compile("PVS.*"), ["PVS1"]), ["PVS1"])
        self.assertListEqual(classifier.occurences(re.compile("PVS.*"), ["PVS1",
                                                                  "PVS3"]),
                                                                 ["PVS1",
                                                                  "PVS3"])
        self.assertListEqual(classifier.occurences(re.compile("PVS.*"), ["PVS1",
                                                                  "PVS3",
                                                                  "PP1"]),
                                                                 ["PVS1",
                                                                  "PVS3"])
        self.assertListEqual(classifier.occurences(re.compile("PM.*"), ["BS2",
                                                                 "BS4",
                                                                 "PVS1",
                                                                 "PVS3",
                                                                 "PM3",
                                                                 "PP2"]),
                                                                ["PM3"])

        self.assertListEqual(classifier.occurences(re.compile("PM.*"), ["BS2",
                                                                 "PM3",
                                                                 "BS4",
                                                                 "PVS1",
                                                                 "PVS3",
                                                                 "PM3",
                                                                 "PP2",
                                                                 "PM1"]),
                                                                ["PM1",
                                                                 "PM3"])

    def test_count_occurences_special_cases(self):
        classifier = ACMGClassifier2015()

        self.assertListEqual(classifier.occurences(re.compile("PP.*"), ["BS2",
                                                                 "PP3",
                                                                 "BS4",
                                                                 "PVS1",
                                                                 "PVS3",
                                                                 "PM3",
                                                                 "PP3",
                                                                 "PP1",
                                                                 "PP2"]),
                                                                ["PP1", # The first of the PP3s returned.
                                                                 "PP2",
                                                                 "PP3"])

        self.assertListEqual(classifier.occurences(re.compile("PP.*"), ["BS2",
                                                                 "PP3",
                                                                 "BS4",
                                                                 "PVS1",
                                                                 "PVS3",
                                                                 "PM3",
                                                                 "PP3",
                                                                 "PP1",
                                                                 "PP1"]),
                                                                ["PP1", # The first of the PP3s returned.
                                                                 "PP3"])

        self.assertListEqual(classifier.occurences(re.compile("BP.*"), ["BP4",
                                                                 "PP3",
                                                                 "BP4",
                                                                 "PVS3",
                                                                 "PVS3",
                                                                 "PM3",
                                                                 "BP3",
                                                                 "PP1",
                                                                 "PP1",
                                                                 "BP4",
                                                                 "BP4"]),
                                                                ["BP3",
                                                                 "BP4"])
        
        self.assertListEqual(classifier.occurences(re.compile("BS.*"), ["BS1",
                                                                 "BS1",
                                                                 "BP4",
                                                                 "PVS3",
                                                                 "PVS3",
                                                                 "PM3",
                                                                 "BP3",
                                                                 "PP1",
                                                                 "PP1",
                                                                 "BP4",
                                                                 "BP4"]),
                                                                ["BS1"])

    def test_classify_pathogenic(self):
        classifier = ACMGClassifier2015()
        path_res = classifier.pathogenic(["BS2",
                "BS4",
                "PVS1",
                "BP7",
                "PS3",
                "PP1"])
        self.assertListEqual(path_res,
                               ["PVS1", # 1PVS* AND >=1PS*
                                "PS3"])

        path_res = classifier.pathogenic(["BS2",
                "PVS1",
                "BS4",
                "PVSX1"])
        self.assertListEqual(path_res,
                               ["PVS1", # >=2PVS*
                                "PVSX1"])

        path_res = classifier.pathogenic([
                "BS2",
                "BS4",
                "PVS1",
                "PS3",
                "PS3",
                "PS3",
                "PP1"])
        self.assertListEqual(path_res,
            ["PVS1", # First 1PVS* AND >=1PS*
            "PS3", # Then >=2 PS*, because of not shortcut/conversion to set:
            ])

        path_res = classifier.pathogenic([
                "BS2",
                "PS4",
                "PM2",
                "PM1",
                "BA3",
                "PP3",
                "PP1"])
        self.assertListEqual(path_res,
            ["PS4", # 1PS* AND 2PM* AND >=2PP*
            "PM1",
            "PM2",
            "PP1",
            "PP3"
            ])

        path_res = classifier.pathogenic([
                "BS2",
                "PS4",
                "PP4",
                "PP6",
                "PP1",
                "BA3",
                "PP3",
                "PP3",
                "PM1"])
        self.assertListEqual(path_res,
            ["PS4", # 1PS* AND 1PM* AND >=4PP*
            "PM1",
            "PP1",
            "PP3",
            "PP4",
            "PP6"
            ])

        self.assertFalse(classifier.pathogenic([
                "BS2",
                "PS4",
                "PP4",
                "PP6",
                "BA3",
                "PP3",
                "PP3",
                "PM1"]))

        self.assertFalse(classifier.pathogenic([
                "BS2",
                "PP4",
                "PP1",
                "PP6",
                "BA3",
                "PP3",
                "PP3",
                "PM1"]))

    def test_classify_likely_pathogenic(self):
        classifier = ACMGClassifier2015()
        lp_res = classifier.likely_pathogenic([
                "BS2",
                "PS4",
                "PP4",
                "PP6",
                "BA3",
                "PP3",
                "PP3",
                "PM1"])
        self.assertListEqual(lp_res,
            ["PS4", # 1PS* AND 1PM*
            "PM1",
            "PS4", # 1PS* AND >=2PP*
            "PP3",
            "PP4",
            "PP6"
            ])

        lp_res = classifier.likely_pathogenic([
                "BS2",
                "PS4",
                "PP4",
                "PP6",
                "PP1",
                "BA3",
                "PP3",
                "PP3",
                "PM1"])
                
        expected =  ['PS4', # First 1PS* AND 1PM*
                    'PM1',
                    'PS4', # Then 1PS* AND >=2PP*
                    'PP1',
                    'PP3',
                    'PP4',
                    'PP6',
                    'PM1', # Then 1PM* AND >=4PP*
                    'PP1',
                    'PP3',
                    'PP4',
                    'PP6']
                    
        self.assertListEqual(lp_res, expected)
     
        lp_res = classifier.likely_pathogenic([
                "BS2",
                "PP4",
                "PP6",
                "PP1",
                "BA3",
                "PP3",
                "PP3",
                "PM1"])
        self.assertListEqual(lp_res,
            ["PM1", # 1PM* AND >=4PP*
            "PP1",
            "PP3",
            "PP4",
            "PP6"
            ])

        lp_res = classifier.likely_pathogenic([
                "BS2",
                "BP4",
                "BP6",
                "BP1",
                "PVS3",
                "BP3",
                "PM3",
                "BM1"])

        self.assertListEqual(lp_res,[
                "PVS3", # 1PVFS* AND 1PM*
                "PM3"])

        self.assertTrue(classifier.likely_pathogenic([
             "PVSX1",
             "PP6",
             "BS2"]))

    def test_classify_benign(self):
        classifier = ACMGClassifier2015()
        lp_res = classifier.benign([
                "BS2",
                "PS4",
                "BAX1",
                "PP6",
                "BA3",
                "BS1",
                "BS2",
                "PM1"])
        self.assertListEqual(lp_res,
            ["BA3", 
             "BAX1", # >=1BA* OR >=2BS*
             "BS1",
             "BS2"])

        self.assertFalse(classifier.benign([
             "PP7",
             "PP6",
             "BS2"]))

    def test_classify_likely_benign(self):
        classifier = ACMGClassifier2015()
        lp_res = classifier.likely_benign([
                "PP2",
                "PS4",
                "BS2",
                "PP6",
                "BA3",
                "BP3"])
        self.assertListEqual(lp_res,
            ["BS2", # 1BS* AND 1BP*
             "BP3"])

        lp_res = classifier.likely_benign([
                "BP2",
                "PS4",
                "PP6",
                "BA3",
                "BP3"])
        self.assertListEqual(lp_res,
            ["BP2", # >=2BP*
             "BP3"])

        self.assertFalse(classifier.likely_benign([
             "PP7",
             "PP6",
             "BS2"]))

    def test_contradict(self):
        classifier = ACMGClassifier2015()
        pathogenic = ["PVS1",
            "PS3"]
        likely_pathogenic = ["PS4",
            "PM1",
            "PS4",
            "PP4",
            "PP6",
            "PP3"]
        benign = ["BA3",
            "BS2",
            "BS1",
            "BS2"]
        likely_benign = ["BS2",
            "BP3"]
        contradict = ["BS2",
            "PVS1",
            "PM3"]
        contradict2 = ["BS2",
                  "PVS1",
                  "PS3",
                  "PS3",
                  "PS3",
                  "PP1"]              
        contributors = classifier.contradict(pathogenic)
        self.assertEquals(contributors, [])
        
        contributors = classifier.contradict(likely_pathogenic)
        self.assertEquals(contributors, [])

        contributors = classifier.contradict(benign)
        self.assertEquals(contributors, [])

        contributors = classifier.contradict(likely_benign)
        self.assertEquals(contributors, [])
        
        contributors = classifier.contradict(contradict)
        self.assertEquals(contributors, ["PVS1", "PM3", "BS2"])
        
        contributors = classifier.contradict(contradict2)
        self.assertEquals(contributors, ["PVS1", "PS3", "BS2"])

    def test_classify(self):
        classifier = ACMGClassifier2015()

        passed = ["PVS1",
                  "PS2",
                  "BA1"]
        self.assertEquals(classifier.classify(passed), ClassificationResult(3, "Uncertain significance",
                 ["PVS1",
                  "PS2",
                  "BA1"
                  ], "Contradiction"))

        passed = ["BS2",
                  "PVS1",
                  "PS3",
                  "PS3",
                  "PS3",
                  "PP1"]
        
        self.assertEquals(classifier.classify(passed), ClassificationResult(3, "Uncertain significance",
            ["PVS1",
            "PS3",
            "BS2"], "Contradiction"))
        
        passed = ["BS2",
                  "PVS1",
                  "PM3"]
        result = classifier.classify(passed)
        
        expected = ClassificationResult(3, "Uncertain significance",
            ["PVS1",
            "PM3", 
            "BS2"
            ], "Contradiction")
        
        self.assertEquals(result.message, expected.message)
    
        passed = [
                "BS2",
                "PP4",
                "PP6",
                "BA3",
                "BS1",
                "BS2",
                "PM1"]
                
        result = classifier.classify(passed)
        expected = ClassificationResult(3, "Uncertain significance",
            ["PM1",
             "BA3",
             "BS1",
             "BS2"
             ], "Contradiction")
        self.assertEquals(result.contributors, expected.contributors)

        passed = [
                "BP4",
                "BP6",
                "PM1"]
        self.assertEquals(classifier.classify(passed), ClassificationResult(2, "Likely benign",
            ["BP4",
             "BP6"
             ], "Likely benign"))

        passed = [
                "PM1",
                "BP6",
                "PP6",                
                "BP7"]        
        self.assertEquals(classifier.classify(passed), 
            ClassificationResult(2, "Likely benign",
                ["BP7"], 
                "Likely benign"
                )
            )
            
        passed = [
                "BS1",
                "BP6",
                "PP6",                
                "BP7"]        
        self.assertEquals(classifier.classify(passed), 
            ClassificationResult(2, "Likely benign",
                ["BS1",
                 "BP7"
                ], "Likely benign"))

        passed = [
                "BP6",
                "PM1"]
        self.assertEquals(classifier.classify(passed), ClassificationResult(3, "Uncertain significance",
            [], "None"))
            
    def test_normalization_pathogenic(self):
        classifier = ACMGClassifier2015()
        sample1 = ["PM2PVS3"]
        sample2 = ["PVS1PM1", "PS3", "PM3"]
        sample3 = ["PM3PS1", "PM1", "PM2", "PM3"]
        sample4 = ["PVS1"]
        sample5 = ["PS1"]
        sample6 = ["PM1", "BA1"]
        
        self.assertEquals(classifier.normalize_pathogenic(sample1),sample1)
        self.assertEquals(classifier.normalize_pathogenic(sample2),["PVS1PM1"])
        self.assertEquals(classifier.normalize_pathogenic(sample3),["PM3PS1"])
        self.assertEquals(classifier.normalize_pathogenic(sample4), sample4)
        self.assertEquals(classifier.normalize_pathogenic(sample5), sample5)
        self.assertEquals(classifier.normalize_pathogenic(sample6), sample6)
        
    def test_normalization_benign(self):    
        classifier = ACMGClassifier2015()
        sample1 = ["BA1"]
        sample2 = ["BA1", "BP2", "BS3"]
        sample3 = ["BS2", "BP3"]
        sample4 = ["BP1", "PVS1"]
        self.assertEquals(classifier.normalize_benign(sample1), sample1)
        self.assertEquals(classifier.normalize_benign(sample2), ["BA1"])
        self.assertEquals(classifier.normalize_benign(sample3), ["BS2"])
        self.assertEquals(classifier.normalize_benign(sample4), sample4)    
        
    def test_presedence(self):    
        classifier = ACMGClassifier2015()
        
        self.assertEquals(classifier.has_higher_precedense("PVS", "PS"), True)
        self.assertEquals(classifier.has_higher_precedense("PS", "PVS"), False)
        self.assertEquals(classifier.has_higher_precedense("PS3", "PMxPS3"), True)
        self.assertEquals(classifier.has_higher_precedense("PMxPS3", "PS3"), False)
        self.assertEquals(classifier.has_higher_precedense("PMxPS3", "PVSxPS3"), False)
        self.assertEquals(classifier.has_higher_precedense("PVSxPS3", "PMxPS3"), True)
        
    def test_find_source(self):    
        classifier = ACMGClassifier2015()
        self.assertEquals(classifier.find_source("PMxPS1"), "PS1")
        self.assertEquals(classifier.find_source("PS1"), "PS1")
        
    def test_filter_out_criteria_with_lower_presedence(self):    
        classifier = ACMGClassifier2015()
        
        self.assertEquals(
            classifier.filter_out_criteria_with_lower_precedense(
                ["PM1", "PVSxPM1", "PS3", "PMxPS3"]
            ), ["PVSxPM1", "PS3"]
        )
        # Tests below are given by domain expert Morten
        self.assertEquals(classifier.filter_out_criteria_with_lower_precedense(
            # Duplicates PP1 is filtered out
            ["PM1", "PP1", "PP1", "PP2", "PP3"]), ["PM1", "PP1", "PP2", "PP3"])
            
        self.assertEquals(classifier.filter_out_criteria_with_lower_precedense(
            # PM1 takes precedence above PPxPM1, hence PPxPM1 gets filtered out
            ["PM1", "PP1", "PP2", "PP3", "PPxPM1"]), ["PP1", "PP2", "PP3", "PM1"])
        
        self.assertEquals(classifier.filter_out_criteria_with_lower_precedense(
            # PM1 takes precedence above PPxPM1, hence PPxPM1 gets filtered out
            ["PMxPP1", "PM1", "PP1", "PP2", "PPxPS1"]), ["PM1", "PMxPP1", "PP2", "PPxPS1"])
            
        self.assertEquals(classifier.filter_out_criteria_with_lower_precedense(
            # PSxPM1 takes precedence above PS1, hence PS1 gets filtered out
            ["PSxPM1", "PS1", "PM1"]), ["PS1", "PSxPM1"])
            
        self.assertEquals(classifier.filter_out_criteria_with_lower_precedense(
            # BSxBP1 takes precedence above BS1, hence BP1 gets filtered out
            ["BSxBP1", "BP1", "BS1"]), ["BSxBP1", "BS1"])
        
        self.assertEquals(classifier.filter_out_criteria_with_lower_precedense(
            ["BS1", "BS2"]), ["BS1", "BS2"])