//<?php
$tValue = $SOSE->GetVar($SOSE->GetVar("_Variable"));
$tValue = utf8_encode($tValue);
$SOSE->Echo(json_encode($tValue));