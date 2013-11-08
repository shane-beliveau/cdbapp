//<?php
$tValue = $SOSE->GetVar($SOSE->GetVar("_Variable"));
$size = getimagesize($tValue);
$SOSE->SetVar("imgWidth", $size[0]);
$SOSE->SetVar("imgHeight", $size[1]);
if ($size[1] > $size[0]) $orientation = "P"; else $orientation = "L";
$SOSE->SetVar("imgOrientation", $orientation);
