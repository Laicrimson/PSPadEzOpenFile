/**-----------------------------------------------------------------------------
 * Filename		: EzOpenFiles.js
 * Last Modified	: 2015/08/02
 * Description		: Find the specified filename in current project.
 * 			  It will list all matched files in the LOG window.
 * Created 		: 17 September 2008
 * Created by 		: PoYang Lai ( Lai.crimson@gmail.com )
 * Tested with		: PSPad 2331 and above
-----------------------------------------------------------------------------**/

/**-----------------------------------------------------------------------------
 * Requirement		: 1. PSPad\Script\JScript\Ezctags\EzOpenFiles.exe
-----------------------------------------------------------------------------**/

/**-----------------------------------------------------------------------------
 * Note			: If only one target file is found, it will open the 
 * 			  target file immediately. Else if more than one 
 * 			  target files are found, it will list all target files 
 * 			  in the LOG window, and user is responsible for identify the 
 * 			  target and reopen it.
 * 			  When files are listed in LOG window, user can use 
 * 			  EzOpenLogIndex to open specified file according to
 * 			  the index.    
-----------------------------------------------------------------------------**/

/**-----------------------------------------------------------------------------
 * Version History	:
 * 0.920                : 08/02/2015
 *                        Support project folder .pspad
 * 0.910                : 02/09/2009
 *                        Now support relative file path in project file.
 * 0.900                : 19/04/2009
 *                        use EzOpenFiles.exe to search project file instead of
 *                        search file in pspad editor. It makes searching file
 *                        more powerful without keep Porject file in pspad.
 * 0.811                : 06/02/2009
 *                        new:
 *                        if select text in active editor, use select text as filename
 *			  else, prompt a dialog to input filename
 * 0.810                : 30/09/2008
 *                        new:
 *                        1.input index 0 to open all files listed in log window
 *                        2.click line in log window to open file
 *
 * 0.800		: 19/09/2008
-----------------------------------------------------------------------------**/

var module_name = "EzOpenFiles";
var module_version = "0.920";
/**
 * Shortcut setting.
 * user can modify shortcut here. 
 **/
var gShortcutOpenFiles = "ALT+O";
//var gShortcutOpenIndex = "ALT+U";
var gShortcutOpenIndex = "";

/**
 * Max matched files setting.
 * In practice, it will burden the pspad when add too much lines to LOG window.
 * So, for performance consideration, it will stop searching when finding 
 * too much matched files. And then user needs to input more precise keyword. 
 **/
var TooMuchMatchedFiles = 99;

/**
 *  Use selected text as filename to find matched file
 **/
var SelTextAsFileName = true;

/**
 * Output strings.
 * All warning strings are listed here. 
 **/ 
var sInputTextPrompt = "\nPlease input a filename...\n";
var sInvalidFileName = "\nInvalid File Name...\n";
var sNoProject = "\nNo Project...\n";
var sProjFileNotExist = "\nProject File is not existed...\n";
var sTooMuchMatchedFiles = "\nToo Much Matched Files...\n";
var sNoMatchFiles = "\nNo Matched Files\n";
var sIndexOutOfRange = "\nIndex Out Of Range...\n";
var sGetErrorLogLine = "\nGet Error Log Line...\n";
var sInputIndexPrompt = "\nPlease input an index number...\nZero to open all files...\n";
var sLogWindowIsNotReady = "\nLog Window Is Not Ready...\n";
// 02/09/2009 var sNotAbSolutePath = "\nThis Project File is not absolute path...\n";
var sFileNotExist = "\nFile is not existed...\n";
/** 
 * EzOpenFiles magic string.
 * For identifying whether the content of LOG window is generated by EzOpenFiles or not. 
 **/
var sEzOpenFilesID = "All Matched Files by EzOpenFiles...";

/**-----------------------------------------------------------------------------
 * Programs
-----------------------------------------------------------------------------**/
//gloabl variables
var AbsolutePathID = "AbsolutePath";
var gAbsolutePath = -1;

var CmdShell = CreateObject("WScript.Shell");
var FSObj = CreateObject("Scripting.FileSystemObject");

function EzOpenFiles()
{
        var ProjFilesCnt = projectFilesCount();
        var ProjName;
        var FileName = null;
        var TargetFile = null;
        var TargetFileCnt = 0;
	var CurrentEditObj = null;
	var Lines = null;
// 02/09/2009 >>>
	var ProjPath;
// 02/09/2009 <<<
// 08/02/2015 >>>
  var PspadFolder;
// 08/02/2015 <<<
	
	var i = 0;
        
	if(ProjFilesCnt<=0){
		echo(sNoProject);
		return;
	}

	// get project filename
        ProjName = projectFileName();
        if(ProjName == null || ProjName == ""){
	        echo(sProjFileNotExist);
                return;
        }        
// 08/02/2015 >>>
	var lastslash = ProjName.lastIndexOf("\\");
	ProjPath = ProjName.substring(0, lastslash+1);
  PspadFolder = ProjPath.concat(".pspad");
  if(!FSObj.FolderExists(PspadFolder)){
    FSObj.CreateFolder(PspadFolder);
    var FolderObj = FSObj.GetFolder(PspadFolder);
    FolderObj.attributes |= 2;
  }
// 08/02/2015 <<<

	// store current editor
	if(editorsCount()!=0){
		CurrentEditObj = newEditor();
		CurrentEditObj.assignActiveEditor();
	}

	// go to current editor before any actions
// 	if(CurrentEditObj){
// 		CurrentEditObj.activate();
// 	}

	// if select text in active editor, use select text as filename
	// else , prompt a dialog to input filename
	
	if(SelTextAsFileName && editorsCount()!=0){
		// get filename from select text
		FileName = CurrentEditObj.selText();
	}
	if(FileName == null || FileName == ""){
		// get input filename
		FileName = inputText( sInputTextPrompt, null, null);
	}

        if(FileName == null || FileName == ""){
	        //echo(sInvalidFileName);
                return;
        }

	var TextStream;
// 08/02/2015 >>>
 	// var TempFile = ProjName.concat(".tmp");
 	var TempFile = PspadFolder.concat("\\.tmp");
// 08/02/2015 <<<
	var EzOpenFilesExe = modulePath();

	EzOpenFilesExe = EzOpenFilesExe.concat("EzOpenFiles\\EzOpenFiles.exe");
	
	// OpenTextFile(filename,
	//		1:ForReading 2:ForWriting 8:ForAppending,
	//		create,
	//		-2:TristateUseDefautl -1:TristateTrue 0:TristateFalse
	//		)
	TextStream = FSObj.OpenTextFile(ProjName, 1, true, -2);
	while(!TextStream.AtEndOfStream){
	        Lines = TextStream.ReadLine();
		if(Lines.slice(0, AbsolutePathID.length) == AbsolutePathID){
		        Lines = Lines.split("=");
                        gAbsolutePath = parseInt(Lines[1]);
                        break;
		}
	}
	TextStream.Close();
	
// 02/09/2009 >>>
// 	if(gAbsolutePath != 1){
// 		echo(sNotAbSolutePath);
// 		return;
// 	}
// 08/02/2015 >>>
// 	if(gAbsolutePath != 1){
// 	        var lastslash = ProjName.lastIndexOf("\\");
// 	        ProjPath = ProjName.substring(0, lastslash+1);
// 	}
// 08/02/2015 <<<
// 02/09/2009 <<<

	// delete temp file
	if(FSObj.FileExists(TempFile))
		FSObj.DeleteFile(TempFile, true);

	// run EzOpenFiles.exe
	CmdShell.Run("\""+EzOpenFilesExe+"\" "+"\""+ProjName+"\" "+"\""+TempFile+"\" "+"SEARCH_FILE "+FileName, 0, true);

	// OpenTextFile(filename,
	//		1:ForReading 2:ForWriting 8:ForAppending,
	//		create,
	//		-2:TristateUseDefautl -1:TristateTrue 0:TristateFalse
	//		)
	TextStream = FSObj.OpenTextFile(TempFile, 1, true, -2);
	i = 1;	// list file index in LOG window
	while(!TextStream.AtEndOfStream){
		Lines = TextStream.ReadLine();
		if(Lines == "" || Lines == null)
		        continue;
// 02/09/2009 >>>
		if(gAbsolutePath != 1){
			Lines = ProjPath.concat(Lines);
		}
// 02/09/2009 <<<

	        if(TargetFileCnt==0){
	                logClear();
	                // configure LOG window
	                logSetTypeList();		// set log window type to List
			logSetParser("* %F");           // set log parser string
			                                // click log window to open file
			logAddLine(sEzOpenFilesID);	// EzOpenFiles Magic String
			TargetFile = Lines;		// TargetFile keeps the first matched file
	        }
	        TargetFileCnt++;
			        
	        // construct output string
	        var logStr = i.toString();	// j starts from 1
		i++;
	        logStr = logStr.concat(" ");
	        logStr = logStr.concat(Lines);
	        logAddLine(logStr);		// list in log window
		
		// search too much files
		if(TargetFileCnt > TooMuchMatchedFiles){
			echo(sTooMuchMatchedFiles);
			break;
		}
	}
	TextStream.Close();

	// open or activate searched file
	if(TargetFileCnt == 1){
		runPSPadAction("aLogWindow");
		OpenActivateFile(TargetFile);
	}else if(TargetFileCnt == 0){
		echo(sNoMatchFiles);
	}
	return;
}

function EzOpenLogIndex()
{
	// nothing in LOG window
	if(logLinesCount()==0){
	        echo(sLogWindowIsNotReady);
		return
	}

	var FileIndex = 0;
	var TargetFile;

	var tmpStr = logGetLine(0);
	var colon_index = 0;

	// identify log window
	if(tmpStr != sEzOpenFilesID){
		echo(sLogWindowIsNotReady);
		return;
	}
	
	// get input index
	FileIndex = inputText( sInputIndexPrompt, 1, -1);
	
	// error input
	if(FileIndex == -1){
		return;
	}else if(FileIndex > logLinesCount()-1){
		echo(sIndexOutOfRange);
		return;
	}
	
	// open all files in LOG window
	if(FileIndex == 0){
		var i;
		for(i=1; i < logLinesCount(); i++){
			// get file in LOG window
			TargetFile = GetFileInLog(i);
			// open or activate file
		        OpenActivateFile(TargetFile);
  		}
	}else{
		// get file in LOG window
		TargetFile = GetFileInLog(FileIndex);
		// open or activate file
	        OpenActivateFile(TargetFile);
	}
	// hide log windows after open file
	runPSPadAction("aLogWindow");
	
	return;
}
function GetFileInLog( file_index)
{
	// get log line
	var tmpStr = logGetLine(file_index);
	if(tmpStr == null || tmpStr == ""){
		echo(sGetErrorLogLine);
		return;
	}

	tmpStr = tmpStr.split(" ");
	return tmpStr[1];
}

function OpenActivateFile( file_name)
{
        var NewEditObj = newEditor(); //New editor object
        var i = FindOpenedFile(file_name);
        if(i == -1){
                if(FSObj.FileExists(file_name)){
			NewEditObj.openFile(file_name);
		}else{
		        echo(sFileNotExist);
		        return;
		}
	}else{
		NewEditObj.assignEditorByIndex(i);
	}
	NewEditObj.activate();
	return;
}

function FindOpenedFile( file_name)
{
	var OpenedEditObj = newEditor();
	var i = 0;
	for(i=0; i< editorsCount(); i++){
		if(OpenedEditObj.assignEditorByIndex(i)){
			if(OpenedEditObj.filename() == file_name){
				return i;
			}
		}
	}
	return -1;
}

function OpenModule()
{
	try{
                OpenActivateFile( moduleFileName(module_name));
	}
	catch(e){
		echo("\nOpen file error...'\n" + moduleFileName(module_name) + "\n" + e.message + "\n");
	}
	return;
}

function Init()
{
	addMenuItem("Ez&OpenFiles", "EzOpenFiles", "EzOpenFiles", gShortcutOpenFiles);
	addMenuItem("EzOpenLog&Index", "EzOpenFiles", "EzOpenLogIndex", gShortcutOpenIndex);
	addMenuItem("-", "EzOpenfiles", "", "");
	addMenuItem("&EditEzOpenFiles", "EzOpenfiles", "OpenModule", "");
}