#include <stdio.h>

FILE * fProject, * fTemp;
char * gPattern;

char ConfigTag[] = "[Config]";
char FileTreeTag[] = "[Project tree]";

void Str2LowCase(char * str)
{
	int i;
	for(i=0;str[i];i++){
	        if(str[i] >= 'A' && str[i] <= 'Z')
	                str[i] += ('a'-'A');
	}
}

void GetConfig()
{
	char buf[512];
	char start = 0;
	while(fgets(buf, sizeof(buf), fProject)){
	        if(buf[0] == '['){
	                if(memcmp(buf, ConfigTag, strlen(ConfigTag))==0){
	                        start = 1;
	                        continue;
			}else{
			        if(start) break;
			}
	        }
	        if(start){
			int i = 0;
			for(i=0;buf[i] == ' ' || buf[i] == '\t';i++);
			fprintf(fTemp, "%s", &buf[i]);
	        }
	}
}

char IsMatchPattern(char * str, char * pattern)
{
	int p_len = strlen(pattern), s_len = strlen(str);
	int i;
	for(i=0;i+p_len <= s_len;i++){
		if(memcmp(&str[i], pattern, p_len)==0)
		        return 1;
	}
	return 0;
}

void SearchFile()
{
	char buf[512];
	char filename[128];
	char start = 0;

	Str2LowCase(gPattern);
	
	while(fgets(buf, sizeof(buf), fProject)){
	        if(buf[0] == '['){
	                if(memcmp(buf, FileTreeTag, strlen(FileTreeTag))==0){
	                        start = 1;
	                        continue;
			}else{
			        if(start) break;
			}
	        }
	        if(start){
			int i;
			// get last slash char
			for(i=strlen(buf)-1;i>=0;i--){
			        if(buf[i] == '\\' || buf[i] == '/')
			                break;
			}
			if(i<0) continue;
			
			strcpy(filename, &buf[i+1]);
			Str2LowCase(filename);

			if(!IsMatchPattern(filename, gPattern))
			        continue;
			        
			for(i=0;buf[i] == ' ' || buf[i] == '\t';i++);
			fprintf(fTemp, "%s", &buf[i]);
	        }
	}
}

void ShowWelcome(char * file)
{
	printf("Command Format: %s ProjectFile TempFile Command\n", file);
	printf("Command: \n");
	printf("        GET_CONFIG \n");
	printf("        SEARCH_FILE Pattern\n");
}

void main(int argc, char * argv[])
{
	if(argc < 4){
	        ShowWelcome(argv[0]);
	        return;
	}

	fProject = fopen(argv[1], "r");
	if(!fProject){
		printf("Can't open project file %s ...\n", argv[1]);
	        ShowWelcome(argv[0]);
	        goto EndEzOpenFile;
	}
	
	fTemp = fopen(argv[2], "w");
	if(!fTemp){
		printf("Can't open temp file %s ...\n", argv[2]);
	        ShowWelcome(argv[0]);
	        goto EndEzOpenFile;
	}

	if(argc > 3){
	        if(strcmp( argv[3], "GET_CONFIG") == 0){
	                if(argc != 4){
	                        ShowWelcome(argv[0]);
	                        goto EndEzOpenFile;
	                }
	                GetConfig();
	        }else if(strcmp( argv[3], "SEARCH_FILE") == 0){
	                if(argc != 5){
	                        ShowWelcome(argv[0]);
	                        goto EndEzOpenFile;
	                }
	                gPattern = argv[4];
	                SearchFile();
	        }else{
	                ShowWelcome(argv[0]);
	        	goto EndEzOpenFile;
	        }
	}

EndEzOpenFile:
	if(fProject)
	        fclose(fProject);
	if(fTemp)
	        fclose(fTemp);
	return;
}
