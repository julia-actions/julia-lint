using JuliaWorkspaces
using JuliaWorkspaces.URIs2: uri2filepath

jw = workspace_from_folders([pwd()])

files = get_text_files(jw)

for file in files
    diagnostics = get_diagnostic(jw, file)

    for diag in diagnostics
        if diag.severity == :error
            println("::error file=$(uri2filepath(file)),line=1,endLine=1,col=1,endColumn=10,title=$(diag.source)::$(diag.message)")
        end
    end
end
