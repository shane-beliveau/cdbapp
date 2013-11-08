//<?php
$tValue = $SOSE->GetVar($SOSE->GetVar("_Variable"));
$tValue = utf8_encode($tValue);
//Remove Line Breaks
$tValue = preg_replace("/[\r\n]/", " ", $tValue);
$tValue = preg_replace("/\s/", " ", $tValue);
//Remove hardreturns and span tags
$patterns[0] = "/<hardreturn>/";
$patterns[1] = "/<\/?span.*?>/";
$patterns[2] = "/<div>/";
$patterns[3] = "/<\/div>/";
$tValue = preg_replace($patterns, "", $tValue);
unset($patterns);
//Replace depricated <b> and <i> tags
$tValue = preg_replace("/<b>/", "<strong>", $tValue);
$tValue = preg_replace("/<\/b>/", "</strong>", $tValue);
$tValue = preg_replace("/<i>/", "<em>", $tValue);
$tValue = preg_replace("/<\/i>/", "</em>", $tValue);
//Convert <br class="hardreturn"/> to <br /><br />
$tValue = preg_replace("/<br\sclass\x3d\"hardreturn\"\s\/>/", "<br /><br />", $tValue);
//Clean up whitespace
$tValue = trim($tValue);
//Format for JSON
$tValue = json_encode($tValue);
//Return clean summary
$SOSE->Echo($tValue);